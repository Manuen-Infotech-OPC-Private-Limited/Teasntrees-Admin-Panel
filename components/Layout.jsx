import { Outlet, Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    Users,
    Bike,
    LogOut,
    FolderTree,
    Calendar,
    Settings,
    MessageSquare,
    Wallet,
    User,
    Shield,
    History,
    Truck,
    UserCog,
    Mail,
    Menu,
    X,
    Ticket,
    Image as ImageIcon,
    Building2,
    Receipt,
    TrendingUp,
    BarChart3,
    CreditCard
} from 'lucide-react';
import logo from '../assets/logoteasntrees.png';

export default function Layout() {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const { brand } = useParams();
    const b = brand || 'teasntrees';

    useEffect(() => {
        const allowedBrands = ['littleh', 'teasntrees'];
        if (brand && !allowedBrands.includes(brand)) {
            const currentPath = location.pathname;
            if (!currentPath.startsWith('/teasntrees')) {
                navigate(`/teasntrees${currentPath}`, { replace: true });
            }
        }
    }, [brand, navigate, location.pathname]);

    // Close mobile menu whenever location changes
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: `/${b}` },
        { icon: FolderTree, label: 'Categories', path: `/${b}/categories` },
        { icon: Package, label: 'Products', path: `/${b}/products` },
        { icon: Calendar, label: 'Seasonal Items', path: `/${b}/products/seasonal` },
        { icon: ShoppingCart, label: 'Orders', path: `/${b}/orders` },
        { icon: Ticket, label: 'Offers & Coupons', path: `/${b}/offers` },
        { icon: ImageIcon, label: 'Promotional Banners', path: `/${b}/banners` },
        { icon: Bike, label: 'Riders', path: `/${b}/riders` },
        { icon: UserCog, label: 'Managers', path: `/${b}/managers` },
        { icon: Truck, label: 'Deliveries', path: `/${b}/deliveries` },
        { icon: Wallet, label: 'Payouts', path: `/${b}/payouts` },
        { icon: Users, label: 'Customers', path: `/${b}/customers` },
        { icon: Mail, label: 'Messages', path: `/${b}/messages` },
        { icon: MessageSquare, label: 'Reviews', path: `/${b}/reviews` },
        { icon: ShoppingCart, label: 'Cart Insights', path: `/${b}/cart-analytics` },
        { icon: Shield, label: 'All Accounts', path: `/${b}/users` },
        { icon: History, label: 'System Logs', path: `/${b}/activity-logs` },
        { icon: TrendingUp, label: 'Sales & Revenue', path: `/${b}/sales` },
        { icon: Receipt, label: 'Purchases', path: `/${b}/purchases` },
        { icon: CreditCard, label: 'Expenses (OPEX)', path: `/${b}/expenses` },
        { icon: Building2, label: 'Vendors', path: `/${b}/vendors` },
        { icon: BarChart3, label: 'Reports & P&L', path: `/${b}/reports` },
        { icon: Settings, label: 'Settings', path: `/${b}/settings` },
        { icon: User, label: 'My Profile', path: `/${b}/profile` },
    ];

    const isActive = (path) => {
        if (path === `/${b}`) {
            return location.pathname === path || location.pathname === `${path}/`;
        }
        if (path === `/${b}/products`) {
            return (location.pathname === path || location.pathname.startsWith(`${path}/`)) && !location.pathname.startsWith(`${path}/seasonal`);
        }
        return location.pathname === path || location.pathname.startsWith(`${path}/`);
    };

    return (
        <div className="min-h-screen lg:h-screen lg:overflow-hidden bg-gray-50/50 flex flex-col lg:flex-row selection:bg-[#56763D] selection:text-white font-sans text-gray-900">
            {/* Mobile Header Bar */}
            <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
                        aria-label="Toggle Navigation Menu"
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6 text-[#56763D]" /> : <Menu className="w-6 h-6 text-[#56763D]" />}
                    </button>
                    <img src={logo} alt="Teas N Trees Logo" className="h-9 w-auto object-contain" />
                </div>
                <span className="text-[10px] font-black text-[#56763D] uppercase tracking-widest bg-[#56763D]/10 px-3 py-1 rounded-full border border-[#56763D]/20 font-teasntrees">
                    {b.toUpperCase()}
                </span>
            </header>

            {/* Mobile Backdrop Overlay */}
            {mobileMenuOpen && (
                <div
                    onClick={() => setMobileMenuOpen(false)}
                    className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
                />
            )}

            {/* Sidebar - Flush full-height sidebar */}
            <aside className={`
                bg-white border-r border-gray-100 flex flex-col z-50 transition-all duration-300 ease-in-out
                lg:w-72 xl:w-80 lg:h-full lg:sticky lg:top-0 lg:rounded-none lg:shadow-none lg:m-0 lg:translate-x-0
                fixed inset-y-0 left-0 w-72 sm:w-80 h-full shadow-2xl rounded-none
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Logo Area */}
                <div className="p-4 lg:p-5 border-b border-gray-50 bg-white flex items-center justify-between lg:block">
                    <div className="flex flex-col items-center gap-1 w-full">
                        <img
                            src={logo}
                            alt="Teas N Trees Logo"
                            className="h-10 lg:h-12 w-auto object-contain"
                        />
                        <p className="text-xl lg:text-2xl font-bold text-[#56763D] font-teasntrees tracking-wide text-center">Admin Portal</p>
                    </div>
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="lg:hidden p-2 rounded-xl text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-3 lg:p-4 flex-1 overflow-y-auto space-y-1 sm:space-y-1.5 no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {navItems.map((item) => {
                        const active = isActive(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={`
                                    flex items-center gap-3.5 px-4 py-2.5 lg:px-5 lg:py-2.5 rounded-2xl transition-all group duration-300
                                    ${active
                                        ? 'bg-[#56763D] text-white shadow-lg shadow-[#56763D]/25 scale-[1.01]'
                                        : 'text-gray-400 hover:text-[#56763D] hover:bg-[#56763D]/10 hover:pl-6'
                                    }
                                `}
                            >
                                <item.icon className={`w-4.5 h-4.5 shrink-0 transition-transform duration-300 group-hover:scale-110 ${active ? 'text-white' : 'text-gray-400 group-hover:text-[#56763D]'}`} />
                                <span className="font-black uppercase text-[10px] tracking-[0.16em] truncate">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Logout Button */}
                <div className="p-3 lg:p-4 border-t border-gray-50 bg-gray-50/30">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3.5 px-4 py-2.5 lg:px-5 lg:py-2.5 rounded-2xl bg-red-50 text-red-500 transition-all hover:bg-red-600 hover:text-white group w-full hover:shadow-lg hover:shadow-red-200"
                    >
                        <LogOut className="w-4.5 h-4.5 shrink-0 transition-transform group-hover:translate-x-1" />
                        <span className="font-black uppercase text-[10px] tracking-[0.16em]">Logout Session</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 lg:p-10 overflow-x-hidden overflow-y-auto h-full scroll-smooth no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                <div className="max-w-[1600px] mx-auto pb-10">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
