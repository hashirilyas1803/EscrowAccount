from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os


# import the blueprints
from backend.routes.admin_routes import admin_blueprint
from backend.routes.builder_routes import builder_blueprint
from backend.routes.buyer_auth_routes import buyer_auth_blueprint
from backend.routes.buyer_routes import buyer_blueprint
from backend.routes.auth_routes import auth_blueprint

# Load the Environment variables
load_dotenv()

# Create the Flask app
app = Flask(__name__)

# Set the secret key
app.secret_key = os.getenv('SECRET_KEY')

# Enable the backend app to process cross-platform requests
CORS(app)

# Register blueprints to allow better structuring of the routes
app.register_blueprint(auth_blueprint, url_prefix='/auth')
app.register_blueprint(buyer_auth_blueprint, url_prefix='/buyer/auth')
app.register_blueprint(builder_blueprint, url_prefix='/builder')
app.register_blueprint(admin_blueprint, url_prefix='/admin')
app.register_blueprint(buyer_blueprint, url_prefix='/buyer')


if __name__ == '__main__':
    app.run(debug=True, port=5000)