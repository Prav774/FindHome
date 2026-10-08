"""Deterministic, explainable comparison of a family case and a person."""

import re
import unicodedata
from difflib import SequenceMatcher


_STOP_WORDS = {
    "a", "an", "and", "at", "by", "data", "demo", "description",
    "found", "in", "is", "male", "female", "of", "person", "the", "wearing",
    "with", "year", "years", "old", "age", "estimated", "unknown",
}


def _value(obj, name):
    return getattr(obj, name, None) if obj is not None else None


def _normalize(value):
    if not value:
        return ""
    plain = unicodedata.normalize("NFKD", str(value)).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", " ", plain.lower()).strip()


def _tokens(value):
    return {token for token in _normalize(value).split() if token not in _STOP_WORDS and len(token) > 1}


def _age_from_text(value):
    if not value:
        return None
    match = re.search(
        r"\bage(?:\s+estimated)?\s*[:=]?\s*(\d{1,3})\s*[-–]\s*(\d{1,3})\b",
        str(value),
        re.IGNORECASE,
    )
    if match:
        low, high = int(match.group(1)), int(match.group(2))
        if 0 <= low <= high <= 120:
            return (low, high)
    match = re.search(r"\bage\s*[:=]?\s*(\d{1,3})\b", str(value), re.IGNORECASE)
    if match:
        age = int(match.group(1))
        return (age, age) if 0 <= age <= 120 else None
    match = re.search(r"\b(\d{1,3})\s*[- ]year[- ]old\b", str(value), re.IGNORECASE)
    if match:
        age = int(match.group(1))
        return (age, age) if 0 <= age <= 120 else None
    return None


def _gender_from_text(value):
    normalized = _normalize(value)
    words = set(normalized.split())
    if "female" in words or "woman" in words or "girl" in words:
        return "female"
    if "male" in words or "man" in words or "boy" in words:
        return "male"
    return None


def _score_text_similarity(left, right):
    left_text, right_text = _normalize(left), _normalize(right)
    if not left_text or not right_text:
        return None
    return SequenceMatcher(None, left_text, right_text).ratio()


def calculate_match(case, person, source_records, evidence):
    """Return a 0-100 match score and plain-language supporting/conflicting signals."""
    source_records = list(source_records or [])
    evidence = list(evidence or [])
    score = 0.0
    supporting = []
    conflicting = []
    missing = []

    # Name: compare against the unified record and every reported name.
    case_name = _value(case, "name")
    reported_names = [_value(person, "name")] + [_value(record, "raw_name") for record in source_records]
    similarities = [(_score_text_similarity(case_name, name), name) for name in reported_names if name]
    similarities = [(similarity, name) for similarity, name in similarities if similarity is not None]
    if case_name and similarities:
        best_similarity, best_name = max(similarities, key=lambda pair: pair[0])
        score += 30 * best_similarity
        if best_similarity >= 0.68:
            supporting.append(f"The reported name {best_name!r} is similar to the family-reported name.")
        elif best_similarity >= 0.45:
            supporting.append(f"The reported name {best_name!r} has some similarity to the family-reported name.")
        else:
            conflicting.append("Name similarity is limited; confirm alternate names or spelling.")
    else:
        missing.append("Name comparison is unavailable because a name is missing.")

    # Age: Case has no age column; only an explicit age cue in its description is used.
    case_age = _age_from_text(_value(case, "description"))
    observed_ages = []
    person_age = _value(person, "age")
    if isinstance(person_age, int) and not isinstance(person_age, bool) and 0 <= person_age <= 120:
        observed_ages.append((person_age, person_age))
    for record in source_records:
        raw_age = _value(record, "raw_age")
        if isinstance(raw_age, int) and not isinstance(raw_age, bool) and 0 <= raw_age <= 120:
            observed_ages.append((raw_age, raw_age))
        age_range = _age_from_text(_value(record, "raw_description"))
        if age_range:
            observed_ages.append(age_range)
    if case_age and observed_ages:
        case_low, case_high = case_age
        range_distances = [
            max(low - case_high, case_low - high, 0)
            for low, high in observed_ages
            if low != high
        ]
        exact_distances = [abs(low - case_low) for low, high in observed_ages if low == high]
        best_exact = min(exact_distances) if exact_distances else None
        best_range = min(range_distances) if range_distances else None
        if best_exact == 0:
            score += 15
        elif best_range == 0:
            score += 14
        else:
            closest = min(distance for distance in (best_exact, best_range) if distance is not None)
            score += 12 if closest <= 2 else 8 if closest <= 5 else 0

        if best_exact == 0 or best_range == 0:
            supporting.append("At least one age report is consistent with the family-reported age.")
        if best_exact is not None and best_exact > 0:
            conflicting.append(f"The closest exact age report differs by {best_exact} year(s); this is not conclusive.")
        elif best_range is not None and best_range > 0:
            conflicting.append(f"The closest reported age range differs by {best_range} year(s); this is not conclusive.")
    else:
        missing.append("Age evidence is unavailable or not explicitly stated.")

    # Gender is usable only when the case description states it explicitly.
    case_gender = _gender_from_text(_value(case, "description"))
    observed_genders = []
    for value in [_value(person, "gender"), *(_value(record, "raw_description") for record in source_records), *(_value(record, "raw_name") for record in source_records)]:
        gender = _gender_from_text(value)
        if gender:
            observed_genders.append(gender)
    if case_gender and observed_genders:
        if case_gender in observed_genders:
            score += 10
            supporting.append("Reported gender is consistent with the family-provided information.")
        else:
            conflicting.append("Reported gender conflicts with the family-provided information; verify with a person.")
    else:
        missing.append("Gender comparison is unavailable because it is not stated on both sides.")

    # Compare descriptive words, excluding age/name/gender cues and generic words.
    case_description = _value(case, "description") or ""
    case_physical_tokens = _tokens(re.sub(r"\bage\s*[:=]?\s*\d{1,3}\b", " ", case_description, flags=re.IGNORECASE))
    physical_descriptions = [_value(person, "physical_description")] + [_value(record, "raw_description") for record in source_records]
    physical_matches = []
    for description in physical_descriptions:
        candidate_tokens = _tokens(description)
        overlap = case_physical_tokens & candidate_tokens
        if overlap and case_physical_tokens:
            ratio = len(overlap) / len(case_physical_tokens)
            physical_matches.append((ratio, overlap))
    if case_physical_tokens and physical_matches:
        best_ratio, best_words = max(physical_matches, key=lambda item: item[0])
        score += 20 * best_ratio
        supporting.append("Reported appearance shares details: " + ", ".join(sorted(best_words)) + ".")
    else:
        missing.append("Physical-description evidence is unavailable or does not overlap.")

    # Location: an exact or close report is useful; different locations are observations, not automatic conflicts.
    case_location = _value(case, "last_seen_location")
    locations = [_value(record, "location") for record in source_records if _value(record, "location")]
    person_location = _value(person, "location")
    if person_location:
        locations.append(person_location)
    location_similarities = [(_score_text_similarity(case_location, location), location) for location in locations]
    location_similarities = [(similarity, location) for similarity, location in location_similarities if similarity is not None]
    if case_location and location_similarities:
        best_location_score, best_location = max(location_similarities, key=lambda pair: pair[0])
        score += 15 * best_location_score
        if best_location_score >= 0.65:
            supporting.append(f"A source report places the person near {best_location!r}, matching the last-seen location.")
        else:
            conflicting.append("Reported locations differ; confirm the person's last known location.")
    else:
        missing.append("Location comparison is unavailable.")

    # Additional source/evidence consistency: independent organizations and corroborating evidence.
    organizations = {_normalize(_value(record, "organization")) for record in source_records if _value(record, "organization")}
    report_tokens = [
        _tokens(" ".join(str(value) for value in (
            _value(record, "raw_name"),
            _value(record, "raw_description"),
            _value(record, "location"),
        ) if value))
        for record in source_records
    ]
    reports_corroborate = any(
        report_tokens[left] & report_tokens[right]
        for left in range(len(report_tokens))
        for right in range(left + 1, len(report_tokens))
    )
    consistency_points = 4 if len(organizations) > 1 and reports_corroborate else 0
    combined_context = _tokens(case_name) | case_physical_tokens | _tokens(case_location)
    corroborating_evidence = []
    for item in evidence:
        value_tokens = _tokens(_value(item, "value"))
        if value_tokens & combined_context:
            corroborating_evidence.append(item)
    consistency_points += min(6, len(corroborating_evidence) * 3)
    if consistency_points:
        score += consistency_points
        if len(organizations) > 1 and reports_corroborate:
            supporting.append("Independent reports corroborate at least one identifying detail.")
        if corroborating_evidence:
            supporting.append("Existing evidence records corroborate details in the family report.")
    else:
        missing.append("Cross-source corroboration is limited.")

    score = round(max(0.0, min(100.0, score)), 1)
    explanation_parts = []
    if supporting:
        explanation_parts.append(" ".join(supporting))
    if conflicting:
        explanation_parts.append(" ".join(conflicting))
    if missing:
        explanation_parts.append("Missing information: " + " ".join(missing))
    explanation_parts.append("Match score: {:.1f}/100. Human verification is required.".format(score))
    return {
        "score": score,
        "supporting_evidence": supporting,
        "conflicting_evidence": conflicting,
        "missing_evidence": missing,
        "explanation": " ".join(explanation_parts),
        "status": "POTENTIAL_MATCH",
    }
