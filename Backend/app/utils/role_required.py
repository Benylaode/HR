from functools import wraps
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity
from flask import jsonify

def role_required(role):
    def wrapper(fn):
        @wraps(fn)
        def decorator(*args, **kwargs):
            verify_jwt_in_request()
            user = get_jwt_identity()

            if user.get("role") != role:
                return jsonify({
                    "status": 403,
                    "message": f"{role} only"
                }), 403

            return fn(*args, **kwargs)
        return decorator
    return wrapper
