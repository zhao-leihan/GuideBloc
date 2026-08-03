import Link from "next/link";
import { HeartFilledIcon } from "@radix-ui/react-icons";

export default function Footer() {
  return (
    <footer className="bg-dark-900 text-dark-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center">
              <img 
                src="/assets/navbar.png" 
                alt="Explomate Logo" 
                className="h-8 md:h-10 w-auto object-contain drop-shadow-[0_0_6px_rgba(255,255,255,0.4)]" 
              />
            </Link>
            <p className="text-sm text-dark-400 leading-relaxed">
              Explore the world with local guides. Pay securely with crypto.
            </p>
            <div className="flex gap-2 items-center">
              <div className="bg-dark-800 border border-dark-700 hover:border-primary/50 p-2 rounded-xl flex items-center justify-center transition-all shadow-sm" title="USDT Accepted">
                <img src="https://upload.wikimedia.org/wikipedia/commons/0/01/USDT_Logo.png" alt="USDT" className="h-5 w-5 object-contain" />
              </div>
              <div className="bg-dark-800 border border-dark-700 hover:border-primary/50 p-2 rounded-xl flex items-center justify-center transition-all shadow-sm" title="USDC Accepted">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Circle_USDC_Logo.svg/1280px-Circle_USDC_Logo.svg.png" alt="USDC" className="h-5 w-5 object-contain" />
              </div>
              <div className="bg-dark-800 border border-dark-700 hover:border-primary/50 p-2 rounded-xl flex items-center justify-center transition-all shadow-sm" title="PayPal Accepted">
                <img src="https://www.vectorlogo.zone/logos/paypal/paypal-icon.svg" alt="PayPal" className="h-5 w-5 object-contain" />
              </div>
            </div>
            <div className="pt-2">
              <a 
                href="https://www.instagram.com/explo.mate?igsh=MXN0dGV6NnI4M2RnNg==" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 text-sm text-dark-400 hover:text-primary transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                </svg>
                <span>@explo.mate</span>
              </a>
            </div>
          </div>

          {/* Explore */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Explore</h4>
            <ul className="space-y-2.5">
              <li><Link href="/explore" className="text-sm hover:text-primary transition-colors">All Tours</Link></li>
              <li><Link href="/explore?category=adventure" className="text-sm hover:text-primary transition-colors">Adventure</Link></li>
              <li><Link href="/explore?category=cultural" className="text-sm hover:text-primary transition-colors">Cultural</Link></li>
              <li><Link href="/explore?category=food" className="text-sm hover:text-primary transition-colors">Food & Drink</Link></li>
              <li><Link href="/explore?category=nature" className="text-sm hover:text-primary transition-colors">Nature</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2.5">
              <li><Link href="/about" className="text-sm hover:text-primary transition-colors">About Us</Link></li>
              <li><Link href="/how-it-works" className="text-sm hover:text-primary transition-colors">How It Works</Link></li>
              <li><Link href="/team" className="text-sm hover:text-primary transition-colors">Our Team</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-display font-semibold text-white mb-4">Support</h4>
            <ul className="space-y-2.5">
              <li><Link href="/help-center" className="text-sm hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link href="/safety" className="text-sm hover:text-primary transition-colors">Safety</Link></li>
              <li><Link href="/terms-of-service" className="text-sm hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy-policy" className="text-sm hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="/cookie-policy" className="text-sm hover:text-primary transition-colors">Cookie Policy</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-dark-700 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-dark-500">
            &copy; {new Date().getFullYear()} Explomate. All rights reserved.
          </p>
          <p className="text-sm text-dark-500">
            Built with <HeartFilledIcon className="w-3.5 h-3.5 text-danger inline-block" /> - Where Adventure Meets Web3
          </p>
        </div>
      </div>
    </footer>
  );
}
