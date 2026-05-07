from django.contrib.auth import authenticate
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from apps.departments.models import Department
from .models import User


class UserSerializer(serializers.ModelSerializer):
    employee_profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "phone",
            "is_active",
            "date_joined",
            "employee_profile",
        ]
        read_only_fields = ["id", "date_joined", "is_active", "employee_profile"]

    def get_employee_profile(self, obj):
        profile = getattr(obj, "employee_profile", None)
        if not profile:
            return None
        request = self.context.get("request")
        raw_value = profile.__dict__.get("profile_image")
        if isinstance(raw_value, str) and raw_value.startswith(("http://", "https://")):
            image_url = raw_value
        elif getattr(profile, "profile_image", None):
            image_url = request.build_absolute_uri(profile.profile_image.url) if request else profile.profile_image.url
        else:
            image_url = None
        return {
            "id": profile.id,
            "employee_id": profile.employee_id,
            "name": profile.name,
            "email": profile.email,
            "phone": profile.phone,
            "favorite_food": profile.favorite_food,
            "profile_image": image_url,
            "department": profile.department.department_name if profile.department else None,
            "department_id": profile.department_id,
            "shift": profile.shift,
            "wallet_balance": str(profile.wallet_balance),
        }


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    password_confirm = serializers.CharField(write_only=True, min_length=6)
    department = serializers.PrimaryKeyRelatedField(queryset=Department.objects.none(), required=False, allow_null=True)
    employee_id = serializers.CharField(required=False, allow_blank=True)
    profile_image = serializers.FileField(required=False, allow_null=True)
    name = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
            "role",
            "phone",
            "department",
            "employee_id",
            "profile_image",
            "name",
        ]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["department"].queryset = Department.objects.all()

    def validate_role(self, value):
        request = self.context.get("request")
        if value in ["admin", "staff"] and (not request or not request.user.is_authenticated or not request.user.is_admin_user):
            raise serializers.ValidationError("Only admins can create admin or staff accounts.")
        return value

    def validate(self, data):
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return data

    def create(self, validated_data):
        from apps.employees.models import Employee

        validated_data.pop("password_confirm")
        department = validated_data.pop("department", None)
        employee_id = validated_data.pop("employee_id", "")
        profile_image = validated_data.pop("profile_image", "")
        display_name = validated_data.pop("name", "").strip()
        password = validated_data.pop("password")
        role = validated_data.get("role", "employee")
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()

        if role == "employee":
            full_name = display_name or f"{user.first_name} {user.last_name}".strip() or user.username
            Employee.objects.create(
                user=user,
                employee_id=employee_id or f"EMP-{user.id:04d}",
                name=full_name,
                email=user.email,
                phone=user.phone,
                profile_image=profile_image or None,
                department=department,
            )
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        user = authenticate(username=data["username"], password=data["password"])
        if user is None:
            raise serializers.ValidationError({"detail": "Invalid username or password."})
        if not user.is_active:
            raise serializers.ValidationError({"detail": "User account is disabled."})
        data["user"] = user
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, min_length=6)

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role", "phone"]
        read_only_fields = ["id", "username", "role"]


def build_auth_response(user):
    refresh = RefreshToken.for_user(user)
    return {
        "message": "Authentication successful.",
        "user": UserSerializer(user).data,
        "tokens": {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        },
    }
