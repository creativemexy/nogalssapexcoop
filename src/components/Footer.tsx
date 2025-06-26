export default function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-[#0D5E42] mb-4">Nogalss</h3>
            <p className="text-gray-300">
              Empowering cooperatives with modern management solutions.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-[#0D5E42] transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-[#0D5E42] transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-[#0D5E42] transition-colors">Security</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-[#0D5E42] transition-colors">Help Center</a></li>
              <li><a href="/contact" className="hover:text-[#0D5E42] transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-[#0D5E42] transition-colors">Documentation</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="#" className="hover:text-[#0D5E42] transition-colors">About</a></li>
              <li><a href="#" className="hover:text-[#0D5E42] transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-[#0D5E42] transition-colors">Careers</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-300">
          <p>&copy; 2025 Nogalss National Apex Cooperative Society Ltd. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
} 