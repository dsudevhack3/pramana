from __future__ import annotations

from dataclasses import dataclass
from threading import Lock

import numpy as np
from PIL import Image, ImageChops, ImageEnhance


MODEL_NAME = "M3-image-forgery"
MODEL_THRESHOLD = 0.50
IMAGE_SIZE = (224, 224)


@dataclass(frozen=True)
class AITamperingResult:
    probability: float
    prediction: str
    model_name: str
    model_available: bool
    error: str | None = None


class AITamperingService:
    """
    Local pretrained image-forgery detector.

    The M3 model receives:
        1. RGB image
        2. ELA image

    and returns the probability that the image is forged/tampered.
    """

    _model = None
    _model_lock = Lock()

    @classmethod
    def _load_model(cls):
        if cls._model is not None:
            return cls._model

        with cls._model_lock:
            if cls._model is not None:
                return cls._model

            try:
                from tensorflow import keras

                from src.modules.photo_verification.services.ai_model_downloader import (
                    get_model_path,
                )

                model_path = get_model_path()

                cls._model = keras.models.load_model(
                    model_path,
                    compile=False,
                )

                return cls._model

            except Exception:
                raise

    @staticmethod
    def _prepare_rgb(
        image: Image.Image,
    ) -> np.ndarray:
        rgb = image.convert("RGB")

        rgb = rgb.resize(
            IMAGE_SIZE,
            Image.Resampling.BILINEAR,
        )

        array = np.asarray(
            rgb,
            dtype=np.float32,
        )

        array /= 255.0

        return np.expand_dims(
            array,
            axis=0,
        )

    @staticmethod
    def _create_ela_image(
        image: Image.Image,
    ) -> Image.Image:
        """
        M3-style ELA preprocessing.

        1. Convert image to RGB.
        2. Re-save at JPEG quality 90.
        3. Compare original with recompressed image.
        4. Amplify difference using the M3 preprocessing scale.
        5. Re-save amplified ELA image at JPEG quality 75.
        """

        import io

        rgb = image.convert("RGB")

        buffer = io.BytesIO()

        rgb.save(
            buffer,
            format="JPEG",
            quality=90,
        )

        buffer.seek(0)

        recompressed = Image.open(
            buffer
        ).convert("RGB")

        difference = ImageChops.difference(
            rgb,
            recompressed,
        )

        # M3 documented ELA brightness amplification.
        scale = 15.0

        ela = ImageEnhance.Brightness(
            difference
        ).enhance(scale)

        ela_buffer = io.BytesIO()

        ela.save(
            ela_buffer,
            format="JPEG",
            quality=75,
        )

        ela_buffer.seek(0)

        return Image.open(
            ela_buffer
        ).convert("RGB")

    @classmethod
    def _prepare_ela(
        cls,
        image: Image.Image,
    ) -> np.ndarray:
        ela = cls._create_ela_image(
            image
        )

        ela = ela.resize(
            IMAGE_SIZE,
            Image.Resampling.BILINEAR,
        )

        array = np.asarray(
            ela,
            dtype=np.float32,
        )

        array /= 255.0

        return np.expand_dims(
            array,
            axis=0,
        )

    @classmethod
    def predict(
        cls,
        image: Image.Image,
    ) -> AITamperingResult:

        try:
            model = cls._load_model()

            rgb = cls._prepare_rgb(
                image
            )

            ela = cls._prepare_ela(
                image
            )

            prediction = model.predict(
                [rgb, ela],
                verbose=0,
            )

            probability = float(
                np.asarray(
                    prediction
                ).reshape(-1)[0]
            )

            probability = max(
                0.0,
                min(
                    1.0,
                    probability,
                ),
            )

            if probability >= MODEL_THRESHOLD:
                result = "POSSIBLE_TAMPERING"
            else:
                result = "LOW_TAMPERING_SIGNAL"

            return AITamperingResult(
                probability=probability,
                prediction=result,
                model_name=MODEL_NAME,
                model_available=True,
            )

        except Exception as exc:

            return AITamperingResult(
                probability=0.0,
                prediction="AI_UNAVAILABLE",
                model_name=MODEL_NAME,
                model_available=False,
                error=str(exc),
            )