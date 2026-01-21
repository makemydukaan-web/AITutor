import React from 'react';
import { Facebook, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">LimeRoots</h3>
            <p className="text-sm leading-relaxed">
              Discover handpicked sarees that blend tradition, comfort, and modern charm. 
              Affordable, stylish, and soulfully curated for every occasion.
            </p>
            <div className="flex gap-4 mt-4">
              <a 
                href="https://www.facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://www.instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                <Instagram size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/collections/new-arrivals" className="hover:text-white transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link to="/collections/tissue" className="hover:text-white transition-colors">
                  Tissue Sarees
                </Link>
              </li>
              <li>
                <Link to="/collections/office-wear" className="hover:text-white transition-colors">
                  Office Wear
                </Link>
              </li>
              <li>
                <Link to="/collections/sale" className="hover:text-white transition-colors">
                  Sale
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Customer Care</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/shipping" className="hover:text-white transition-colors">
                  Shipping Policy
                </Link>
              </li>
              <li>
                <Link to="/returns" className="hover:text-white transition-colors">
                  Return & Exchange
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-white text-lg font-bold mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <Mail size={16} className="mt-1 flex-shrink-0" />
                <a href="mailto:info@limeroots.in" className="hover:text-white transition-colors">
                  info@limeroots.in
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Phone size={16} className="mt-1 flex-shrink-0" />
                <a href="tel:+919876543210" className="hover:text-white transition-colors">
                  +91 98765 43210
                </a>
              </li>
              <li className="flex items-start gap-2">
                <MapPin size={16} className="mt-1 flex-shrink-0" />
                <span>India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 pt-8 mt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>© 2025 LimeRoots. All rights reserved.</p>
            <div className="flex gap-6">
              <span>Free Shipping</span>
              <span>•</span>
              <span>Cash on Delivery</span>
              <span>•</span>
              <span>Secure Payments</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
