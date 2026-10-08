"""Small, deterministic prompts for the next useful verification step."""


def recommend_next_evidence(case, person, supporting_evidence, conflicting_evidence):
    supporting = [str(item).lower() for item in supporting_evidence or []]
    conflicting = [str(item).lower() for item in conflicting_evidence or []]
    description = getattr(case, "description", None) or ""
    person_description = getattr(person, "physical_description", None) or ""

    physical_supported = any("appearance" in item or "physical" in item for item in supporting)
    physical_missing = any("physical" in item for item in conflicting) or not person_description
    if description and physical_missing and not physical_supported:
        return {
            "question": "Can you collect a distinctive physical mark or identifying feature?",
            "reason": "The current physical-description information is missing or does not yet support a comparison.",
        }

    if any("age" in item for item in conflicting):
        return {
            "question": "Can you verify the person's approximate age or date of birth?",
            "reason": "Reported age information differs and needs human confirmation.",
        }

    if any("location" in item for item in conflicting) or not getattr(case, "last_seen_location", None):
        return {
            "question": "Can you confirm the person's last known location?",
            "reason": "Location information is missing or differs across reports.",
        }

    if any("name" in item for item in conflicting) or not getattr(case, "name", None) or not getattr(person, "name", None):
        return {
            "question": "Can you collect an alternate name, spelling, or alias?",
            "reason": "The available names are missing or provide limited similarity.",
        }

    return {
        "question": "Can another organization independently confirm one reported detail?",
        "reason": "An independent observation can help a human reviewer assess this candidate.",
    }
