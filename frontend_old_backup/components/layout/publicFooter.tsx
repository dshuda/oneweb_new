import Link from "next/link"

const PublicFooter: React.FC = () => {
    return (
        <footer className="bg-[#F8FAFC] pt-12 pb-6">
            <div className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div>
                        <h3 className="text-xl font-bold mb-4">One Tap Services</h3>
                        <p className="text-gray-900">Connecting you with the best service providers for your home and lifestyle needs. Quality assured.</p>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Company</h4>
                        <ul className="space-y-2 text-gray-900">
                            <li><Link href="#" className="hover:text-white">About us</Link></li>
                            <li><Link href="#" className="hover:text-white">Careers</Link></li>
                            <li><Link href="#" className="hover:text-white">Partner with us</Link></li>
                            <li><Link href="/services" className="hover:text-white">Services</Link></li>
                            <li><Link href="/blogs" className="hover:text-white">Blogs</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-semibold mb-4">Legal & Support</h4>
                        <ul className="space-y-2 text-gray-900">
                            <li><Link href="#" className="hover:text-white">Terms of Service</Link></li>
                            <li><Link href="#" className="hover:text-white">Privacy Policy</Link></li>
                            <li><Link href="#" className="hover:text-white">Contact Support</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-10">
                    <p> © 2026 One Tap Service Ltd. All rights reserved.</p>
                </div>
            </div>
        </footer>
    )
}

export default PublicFooter;