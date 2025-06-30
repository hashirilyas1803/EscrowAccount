import bcrypt

# Utility functions for password hashing and verification using bcrypt.
# These help securely store and check user passwords in the database.

def hash_password(password):
    """
    Generate a salted bcrypt hash for a plaintext password.

    - `password` should be the user's plaintext password.
    - Returns the resulting hash as a UTF-8–decoded string for storage.
    """
    # Generate a random salt and compute the hash
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(password.encode('utf-8'), salt)
    # Decode bytes to string for JSON/db storage
    return hashed_bytes.decode('utf-8')


def check_password(hashed_password, password):
    """
    Verify a plaintext password against a stored bcrypt hash.

    - `hashed_password` is the UTF-8–encoded hash from storage.
    - `password` is the plaintext candidate.
    - Returns True if they match, False otherwise.
    """
    # Encode stored hash and candidate password for comparison
    return bcrypt.checkpw(
        password.encode('utf-8'),
        hashed_password.encode('utf-8')
    )