import Link from 'next/link';

/**
 * A simple page shown to users who try to access a route
 * they do not have the correct role for.
 */
const UnauthorizedPage = () => {
    return (
        <div className="text-center mt-20">
            <h1 className="text-4xl font-bold text-red-600">Access Denied</h1>
            <p className="mt-4 text-lg text-gray-700">You do not have permission to view this page.</p>
            <Link href="/dashboard" legacyBehavior>
                <a className="mt-6 inline-block bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 font-semibold">
                    Go to Your Dashboard
                </a>
            </Link>
        </div>
    );
};

export default UnauthorizedPage;