import Link from 'next/link';

export default function Unauthorized() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-white">
            <div className="max-w-sm w-full text-center">
                <div className="mb-8">
                    <div className="w-20 h-20 mx-auto bg-red-50 rounded-full flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-10 h-10 text-red-500"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
                        </svg>
                    </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-3">Access denied</h1>
                <p className="text-gray-500 mb-8">
                    You don't have permission to view this page. Contact your administrator for access.
                </p>

                <Link
                    href="/"
                    className="inline-flex items-center justify-center w-full py-3.5 px-6 rounded-lg bg-[#1769ff] text-white font-medium hover:bg-[#1458d9] transition-all"
                >
                    Return to sign in
                </Link>
            </div>
        </div>
    );
}
