# Entry point for the Flask backend API server for the escrow demo application.
# Loads environment variables, initializes the Flask app, configures security and CORS,
# and registers route blueprints for authentication, builder, buyer, and admin functionality.

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os

# Import route blueprints to organize API endpoints by role/purpose
from backend.routes.admin_routes import admin_blueprint
from backend.routes.builder_routes import builder_blueprint
from backend.routes.buyer_auth_routes import buyer_auth_blueprint
from backend.routes.buyer_routes import buyer_blueprint
from backend.routes.auth_routes import auth_blueprint

# Load environment variables from .env into the environment
load_dotenv()

# Initialize the Flask application
app = Flask(__name__)

# Configure session cookie to use 'Lax' same-site policy for basic CSRF protection
app.config['SESSION_COOKIE_SAMESITE'] = 'Lax'

# Set the secret key for signing session cookies, sourced from environment
app.secret_key = os.getenv('SECRET_KEY')

# Enable Cross-Origin Resource Sharing (CORS) to accept requests from the Next.js frontend
# Allows credentials (cookies) to be included in requests from the specified origin.
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}, supports_credentials=True)

# Register each blueprint under its URL prefix to modularize route handling:
#  - /auth       : Builder and admin authentication routes
#  - /buyer/auth : Buyer-specific authentication routes
#  - /builder    : Builder-facing endpoints (projects, bookings)
#  - /admin      : Admin-facing endpoints (overview across all builders)
#  - /buyer      : Buyer-facing endpoints (unit browsing, bookings)
app.register_blueprint(auth_blueprint, url_prefix='/auth')
app.register_blueprint(buyer_auth_blueprint, url_prefix='/buyer/auth')
app.register_blueprint(builder_blueprint, url_prefix='/builder')
app.register_blueprint(admin_blueprint, url_prefix='/admin')
app.register_blueprint(buyer_blueprint, url_prefix='/buyer')

# When executed directly, start the Flask development server on port 5000 with debug enabled
if __name__ == '__main__':
    app.run(debug=True, port=5000)