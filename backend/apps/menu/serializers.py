from rest_framework import serializers

from .models import MenuItem


class MenuItemSerializer(serializers.ModelSerializer):
    meal_type_display = serializers.CharField(source="get_meal_type_display", read_only=True)
    image = serializers.FileField(required=False, allow_null=True, use_url=False)
    is_available = serializers.BooleanField(required=False, default=True)

    class Meta:
        model = MenuItem
        fields = [
            "id",
            "food_name",
            "meal_type",
            "meal_type_display",
            "description",
            "price",
            "availability_date",
            "is_available",
            "image",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def _resolve_image(self, obj):
        request = self.context.get("request")
        raw_value = obj.__dict__.get("image")
        if not raw_value:
            return None
        if isinstance(raw_value, str) and raw_value.startswith(("http://", "https://")):
            return raw_value
        if getattr(obj, "image", None):
            url = obj.image.url
            return request.build_absolute_uri(url) if request else url
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["image"] = self._resolve_image(instance)
        return data

    def create(self, validated_data):
        if "is_available" not in validated_data:
          validated_data["is_available"] = True
        return super().create(validated_data)
