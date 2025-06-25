import Link from 'next/link';

const UnauthorizedPage = () => {
    return (
        <div className="text-center">
            <h1 className="text-4xl font-bold text-red-600">Access Denied</h1>
            <p className="mt-4 text-lg">You do not have permission to view this page.</p>
            <Link href="/dashboard" legacyBehavior>
                <a className="mt-6 inline-block bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700">
                    Go to your Dashboard
                </a>
            </Link>
        </div>
    );
};

export default UnauthorizedPage;