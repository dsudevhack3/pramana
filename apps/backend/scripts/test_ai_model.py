import sys

from PIL import Image

from src.modules.photo_verification.services.ai_tampering_service import (
    AITamperingService,
)


def main() -> int:

    if len(sys.argv) != 2:
        print(
            "Usage: python scripts/test_ai_model.py <image_path>"
        )
        return 1

    image_path = sys.argv[1]

    try:
        image = Image.open(
            image_path
        ).convert("RGB")

        result = AITamperingService.predict(
            image
        )

        print()
        print("======================================")
        print("       M3 AI FORGERY ANALYSIS")
        print("======================================")
        print(
            f"Model:        {result.model_name}"
        )
        print(
            f"Available:    {result.model_available}"
        )
        print(
            f"Probability:  {result.probability:.4f}"
        )
        print(
            f"Percentage:   {result.probability * 100:.2f}%"
        )
        print(
            f"Prediction:   {result.prediction}"
        )

        if result.error:
            print(
                f"Error:        {result.error}"
            )

        print("======================================")
        print()

        return 0 if result.model_available else 2

    except Exception as exc:

        print(
            f"AI model test failed: {exc}"
        )

        return 1


if __name__ == "__main__":
    raise SystemExit(main())