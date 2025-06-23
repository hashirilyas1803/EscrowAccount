from flask import Flask
from flask_cors import CORS

# import the blueprints
from backend.routes.builder_routes import builder_blueprint
from backend.routes.buyer_auth_routes import buyer_auth_blueprint
from routes.auth_routes import auth_blueprint

# Create the Flask app
app = Flask(__name__)

# Enable the backend app to process cross-platform requests
CORS(app)

# Register blueprints to allow better structuring of the routes
app.register_blueprint(auth_blueprint, url_prefix='/auth')
app.register_blueprint(buyer_auth_blueprint, url_prefix='/auth')
app.register_blueprint(builder_blueprint, url_prefix='/auth')


if __name__ == '__main__':
    app.run(debug=True, port=5000)