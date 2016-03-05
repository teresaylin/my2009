from django.core.exceptions import ValidationError
from django.utils.deconstruct import deconstructible
from PIL import Image

@deconstructible
class ImageMaxSizeValidator:
    def __init__(self, max_w=None, max_h=None):
        self.max_w = max_w
        self.max_h = max_h

    def __call__(self, value):
        img = Image.open(value.file)

        if \
            (self.max_w and img.size[0] > self.max_w) or \
            (self.max_h and img.size[1] > self.max_h) \
        :
            raise ValidationError(
                'Image must be no larger than %(max_w)ix%(max_h)ipx in size',
                params={'max_w': self.max_w, 'max_h': self.max_h},
            )
