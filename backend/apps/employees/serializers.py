from rest_framework import serializers

from apps.users.serializers import UserSerializer
from .models import Employee


class EmployeeSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    department_name = serializers.CharField(source="department.department_name", read_only=True)
    profile_image = serializers.FileField(required=False, allow_null=True, use_url=False)

    class Meta:
        model = Employee
        fields = [
            "id",
            "user",
            "employee_id",
            "name",
            "email",
            "phone",
            "favorite_food",
            "profile_image",
            "department",
            "department_name",
            "shift",
            "wallet_balance",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def _resolve_profile_image(self, obj):
        request = self.context.get("request")
        raw_value = obj.__dict__.get("profile_image")
        if not raw_value:
            return None
        if isinstance(raw_value, str) and raw_value.startswith(("http://", "https://")):
            return raw_value
        if getattr(obj, "profile_image", None):
            url = obj.profile_image.url
            return request.build_absolute_uri(url) if request else url
        return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["profile_image"] = self._resolve_profile_image(instance)
        return data

    def update(self, instance, validated_data):
        user = instance.user
        name = validated_data.get("name", instance.name)
        email = validated_data.get("email", instance.email)
        phone = validated_data.get("phone", instance.phone)

        instance = super().update(instance, validated_data)

        if user:
            name_parts = name.split()
            user.first_name = name_parts[0] if name_parts else ""
            user.last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else ""
            user.email = email
            user.phone = phone
            user.save(update_fields=["first_name", "last_name", "email", "phone"])

        return instance


class EmployeeCreateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=6)

    class Meta:
        model = Employee
        fields = [
            "username",
            "password",
            "employee_id",
            "name",
            "email",
            "phone",
            "profile_image",
            "department",
            "shift",
        ]

    def create(self, validated_data):
        from apps.users.models import User

        username = validated_data.pop("username")
        password = validated_data.pop("password")
        user = User.objects.create_user(
            username=username,
            password=password,
            email=validated_data.get("email", ""),
            first_name=validated_data.get("name", "").split(" ")[0],
            last_name=" ".join(validated_data.get("name", "").split(" ")[1:]),
            role="employee",
            phone=validated_data.get("phone", ""),
        )
        return Employee.objects.create(user=user, **validated_data)
