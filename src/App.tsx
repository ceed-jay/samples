
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  PlusCircle, 
  Truck, 
  ShieldCheck, 
  Search, 
  Upload, 
  CreditCard, 
  PackageCheck,
  Smartphone,
  CheckCircle2,
  X,
  ArrowRight,
  Shield,
  Store,
  Bike,
  Loader2,
  MapPin,
  User,
  ChevronRight,
  BarChart3,
  Activity,
  Clock,
  LogOut,
  Bell,
  Settings,
  Navigation,
  ShoppingBag,
  History,
  Timer,
  RefreshCcw,
  Wifi,
  WifiOff,
  CloudOff,
  AlertCircle,
  AlertTriangle,
  Tag,
  Save,
  Power,
  Navigation2,
  Briefcase,
  Zap,
  Car,
  Star,
  Check,
  FileText,
  Wallet,
  Flag,
  Play,
  ZapIcon,
  ExternalLink,
  Layers,
  Sparkles,
  Info,
  Radar,
  Phone,
  Mail,
  Lock,
  Filter,
  MoreVertical,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Package,
  Image as ImageIcon,
  FlaskConical,
  ListFilter,
  Pill,
  CreditCard as PaymentIcon,
  FileWarning,
  Send,
  Calendar,
  Users,
  ChevronDown,
  Menu,
  MessageSquare,
  LayoutDashboard,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { createClient } from '@supabase/supabase-js';

/**
 * BRANDING & API CONFIGURATION
 */
const LOGO_IMAGE_URL = 'https://i.imgur.com/6dlmEC9.png'; 
const SUPABASE_URL = 'https://yluoxqepusebwxbocndl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdW94cWVwdXNlYnd4Ym9jbmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkyNTU1ODIsImV4cCI6MjA4NDgzMTU4Mn0.q8R4qJocLeFk3_2BP8Z6CXoa9D1ItrIHopt1JpzF5WQ';

import axios from 'axios';
import RiderTrackingMap from './components/RiderTrackingMap';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Global Utilities ---

const fetchWithRetry = async (fn: () => any, retries = 3, delay = 1000): Promise<any> => {
  try {
    const response = await fn();
    if (response && response.error) throw response.error;
    return response;
  } catch (err: any) {
    const isNetworkError = err instanceof TypeError || err.message?.includes('fetch');
    if (retries === 0 || !isNetworkError || !window.navigator.onLine) throw err;
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(fn, retries - 1, delay * 2);
  }
};

const formatTimeAgo = (date: string) => {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(date).toLocaleDateString();
};

// --- Shared Design Components ---

const Logo = ({ size = "md", color = "blue", onClick }: { size?: "sm" | "md", color?: "blue" | "white", onClick?: (e: React.MouseEvent) => void }) => {
  const containerClasses = size === "md" ? "w-8 h-8 sm:w-9 sm:h-9 rounded-lg" : "w-7 h-7 rounded-md";
  const iconSize = size === "md" ? 20 : 16;
  const textColor = color === "blue" ? "text-blue-600" : "text-white";
  const textSize = size === "md" ? "text-lg sm:text-xl font-black" : "text-base font-bold";

  return (
    <div className="flex items-center space-x-2 cursor-pointer select-none group" onClick={onClick}>
      <div className={`${containerClasses} ${LOGO_IMAGE_URL ? 'bg-transparent overflow-hidden' : 'bg-blue-600'} flex items-center justify-center shadow transition-transform active:scale-95`}>
        {LOGO_IMAGE_URL ? (
          <img src={LOGO_IMAGE_URL} alt="MedGO Logo" className="w-full h-full object-contain" />
        ) : (
          <PlusCircle className="text-white" size={iconSize} />
        )}
      </div>
      <span className={`${textSize} ${textColor} tracking-tight`}>MedGO</span>
    </div>
  );
};



// --- Inventory Modal ---

const ProductModal = ({ isOpen, onClose, pharmacyId, product, onSuccess }: { 
  isOpen: boolean, 
  onClose: () => void, 
  pharmacyId: string, 
  product: any | null, 
  onSuccess: () => void 
}) => {
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '', 
    price: '', 
    stock_quantity: '', 
    image_url: '' 
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        stock_quantity: product.stock_quantity.toString(),
        image_url: product.image_url || ''
      });
    } else {
      setFormData({ name: '', description: '', price: '', stock_quantity: '', image_url: '' });
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        pharmacy_id: pharmacyId,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
        image_url: formData.image_url || 'https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=400'
      };

      if (product) {
        await supabase.from('products').update(payload).eq('id', product.id);
      } else {
        await supabase.from('products').insert([{ ...payload, id: crypto.randomUUID() }]);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to save product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-xl">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden p-5 sm:p-6 border border-slate-200">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">{product ? 'Update Inventory' : 'Add New Item'}</h3>
            <p className="text-[10px] text-slate-500 font-medium">Enter product details for your pharmacy inventory.</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Product Name</label>
            <input required placeholder="e.g., Paracetamol 500mg" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Description</label>
            <textarea placeholder="Clinical details and usage instructions..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all h-20 resize-none" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Price (₱)</label>
              <input required type="number" step="0.01" placeholder="0.00" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Stock Level</label>
              <input required type="number" placeholder="Units" className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all" value={formData.stock_quantity} onChange={e => setFormData({...formData, stock_quantity: e.target.value})} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-0.5">Image URL</label>
            <input placeholder="https://..." className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition-all" value={formData.image_url} onChange={e => setFormData({...formData, image_url: e.target.value})} />
          </div>
          <div className="pt-2">
            <button disabled={isSubmitting} type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-xs shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : (product ? 'Update Item' : 'Register Item')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const AddressModal = ({ isOpen, onClose, userId, address, onSuccess }: { 
  isOpen: boolean, 
  onClose: () => void, 
  userId: string, 
  address: any | null, 
  onSuccess: () => void 
}) => {
  const [formData, setFormData] = useState({ 
    address: '', 
    lat: '', 
    lng: '',
    is_default: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (address) {
      setFormData({
        address: address.address,
        lat: address.lat.toString(),
        lng: address.lng.toString(),
        is_default: address.is_default
      });
    } else {
      setFormData({ address: '', lat: '', lng: '', is_default: false });
    }
  }, [address, isOpen]);

  const handleGeocode = async () => {
    if (!formData.address) return;
    setIsSubmitting(true);
    try {
      const response = await axios.get(`/api/geocode`, {
        params: {
          text: formData.address
        }
      });
      if (response.data.features && response.data.features.length > 0) {
        const [lng, lat] = response.data.features[0].geometry.coordinates;
        setFormData(prev => ({ ...prev, lat: lat.toString(), lng: lng.toString() }));
      } else {
        alert("Address not found. Please enter coordinates manually.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      alert("Failed to find address coordinates.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({ 
          ...prev, 
          lat: position.coords.latitude.toString(), 
          lng: position.coords.longitude.toString() 
        }));
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Failed to get current location.");
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = {
        user_id: userId,
        address: formData.address,
        lat: parseFloat(formData.lat),
        lng: parseFloat(formData.lng),
        is_default: formData.is_default
      };

      if (formData.is_default) {
        // Unset other defaults
        await supabase.from('user_addresses').update({ is_default: false }).eq('user_id', userId);
      }

      if (address) {
        await supabase.from('user_addresses').update(payload).eq('id', address.id);
      } else {
        await supabase.from('user_addresses').insert([{ ...payload, id: crypto.randomUUID() }]);
      }
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Address save error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 backdrop-blur-xl">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="relative bg-white w-full max-w-xl rounded-[32px] sm:rounded-[40px] shadow-2xl overflow-hidden p-6 sm:p-10 border border-slate-100">
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">{address ? 'Update Address' : 'Add New Address'}</h3>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-900 transition-colors"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Address</label>
            <div className="flex gap-2">
              <input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="flex-1 px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="e.g. 123 Medical St., Manila" />
              <button 
                type="button"
                onClick={handleGeocode}
                className="px-4 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 hover:bg-blue-100 transition-colors"
                title="Find coordinates from address"
              >
                <Search size={18} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Latitude</label>
              <input required type="number" step="any" value={formData.lat} onChange={e => setFormData({...formData, lat: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="14.5995" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Longitude</label>
              <input required type="number" step="any" value={formData.lng} onChange={e => setFormData({...formData, lng: e.target.value})} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="120.9842" />
            </div>
          </div>
          <button 
            type="button"
            onClick={handleCurrentLocation}
            className="w-full py-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center justify-center gap-2"
          >
            <MapPin size={14} /> Use My Current Location
          </button>
          <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <input type="checkbox" id="is_default" checked={formData.is_default} onChange={e => setFormData({...formData, is_default: e.target.checked})} className="w-5 h-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500" />
            <label htmlFor="is_default" className="text-xs font-bold text-slate-700 cursor-pointer select-none">Set as Default Delivery Address</label>
          </div>
          <button disabled={isSubmitting} type="submit" className="w-full bg-slate-900 text-white py-4 sm:py-5 rounded-[24px] sm:rounded-[28px] font-black uppercase text-xs tracking-[0.2em] sm:tracking-[0.3em] shadow-2xl mt-4 hover:bg-blue-600 active:scale-95 transition-all border-b-6 sm:border-b-8 border-slate-950">
            {isSubmitting ? 'SAVING...' : (address ? 'UPDATE ADDRESS' : 'SAVE ADDRESS')}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// --- Rider Portal ---

const PAYMENT_METHODS = {
  GCash: {
    name: 'GCash',
    iconUrl: 'https://i.imgur.com/UY6x3L0.png',
    qrCodeImgUrl: 'https://i.imgur.com/nap1wiw.jpeg',
    color: 'blue'
  },
  Visa: {
    name: 'Visa',
    iconUrl: 'https://i.imgur.com/wDZx97P.png',
    qrCodeImgUrl: 'https://i.imgur.com/8jJSB9x.jpeg',
    color: 'indigo'
  }
};

const RiderPortal = ({ user, onLogout }: { user: any, onLogout: () => void }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [activeOrder, setActiveOrder] = useState<any>(null);
  const [availableOrders, setAvailableOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [riderLocation, setRiderLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<keyof typeof PAYMENT_METHODS | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data } = await supabase.from('profiles').select('is_online').eq('id', user.id).maybeSingle();
      if (data) {
        setIsOnline(data.is_online || false);
      }
    };
    fetchProfile();
  }, [user.id]);

  const toggleOnlineStatus = async () => {
    const newStatus = !isOnline;
    setIsOnline(newStatus);
    await supabase.from('profiles').update({ is_online: newStatus }).eq('id', user.id);
  };

  const fetchMessages = async (orderId: string) => {
    const { data, error } = await supabase.from('chat_messages').select('*').eq('order_id', orderId).order('created_at', { ascending: true });
    if (error) console.error("Fetch messages error:", error);
    if (data) setMessages(data);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeOrder) return;
    
    const msg = newMessage;
    setNewMessage('');
    
    const { error } = await supabase.from('chat_messages').insert([{
      order_id: activeOrder.id,
      sender_id: user.id,
      sender_type: 'rider',
      content: msg
    }]);

    if (error) {
      console.error("Chat send error:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchOrders = async () => {
    try {
      const { data: activeRaw } = await supabase.from('orders').select('*').eq('rider_id', user.id).neq('status', 'Delivered').maybeSingle();
      const { data: availRaw } = await supabase.from('orders').select('*').neq('status', 'Delivered').is('rider_id', null);
      
      const allRawOrders = [...(activeRaw ? [activeRaw] : []), ...(availRaw || [])];
      const pharmacyIds = [...new Set(allRawOrders.map(o => o.pharmacy_id))];
      const customerIds = [...new Set(allRawOrders.map(o => o.customer_id).filter(Boolean))];

      let phMap: Record<string, any> = {};
      if (pharmacyIds.length > 0) {
        const { data: phs } = await supabase.from('pharmacies').select('*').in('id', pharmacyIds);
        phs?.forEach(p => { phMap[p.id] = p; });
      }

      let profileMap: Record<string, any> = {};
      if (customerIds.length > 0) {
        const { data: profiles } = await supabase.from('profiles').select('*').in('id', customerIds);
        profiles?.forEach(p => { profileMap[p.id] = p; });
      }

      let addressMap: Record<string, any> = {};
      if (customerIds.length > 0) {
        const { data: addresses } = await supabase.from('user_addresses').select('*').in('user_id', customerIds);
        addresses?.forEach(a => {
          // Map by user_id and address string to find the exact one used for the order
          addressMap[`${a.user_id}_${(a.address || '').trim().toLowerCase()}`] = a;
          // Priority to default address
          if (!addressMap[a.user_id] || a.is_default) {
            addressMap[a.user_id] = a;
          }
        });
      }

      const processOrder = (o: any) => {
        const exactAddr = o.customer_id ? addressMap[`${o.customer_id}_${(o.customer_address || '').trim().toLowerCase()}`] : null;
        const defaultAddr = o.customer_id ? addressMap[o.customer_id] : null;
        const addr = exactAddr || defaultAddr;
        return {
          ...o,
          pharmacies: phMap[o.pharmacy_id],
          customer_profile: profileMap[o.customer_id],
          // Use registered address coordinates from user_addresses table
          lat: addr && addr.lat != null ? Number(addr.lat) : (o.lat ? Number(o.lat) : null),
          lng: addr && addr.lng != null ? Number(addr.lng) : (o.lng ? Number(o.lng) : null)
        };
      };

      setActiveOrder(activeRaw ? processOrder(activeRaw) : null);
      setAvailableOrders(availRaw?.map(processOrder) || []);
    } catch (e) {
      console.warn("Rider sync error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('rider-live').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders).subscribe();
    
    let msgChannel: any;
    if (activeOrder?.id) {
      fetchMessages(activeOrder.id);
      msgChannel = supabase.channel(`chat_messages-${activeOrder.id}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `order_id=eq.${activeOrder.id}` }, (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }).subscribe();
    }

    let watchId: number;
    if (isOnline && "geolocation" in navigator) {
      // Get initial position immediately
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setRiderLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        (error) => console.error("Initial GPS Error:", error),
        { enableHighAccuracy: true }
      );

      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLoc = { lat: position.coords.latitude, lng: position.coords.longitude };
          setRiderLocation(newLoc);
        },
        (error) => console.error("GPS Error:", error),
        { enableHighAccuracy: true }
      );
    }

    return () => { 
      supabase.removeChannel(channel); 
      if (msgChannel) supabase.removeChannel(msgChannel);
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [user.id, isOnline, activeOrder?.id]);

  // Sync rider location to database
  useEffect(() => {
    if (isOnline && riderLocation) {
      const syncLocation = async () => {
        if (activeOrder?.id) {
          await supabase.from('orders').update({
            rider_lat: riderLocation.lat,
            rider_lng: riderLocation.lng
          }).eq('id', activeOrder.id);
        }
        
        // Still update last_active in profiles as it's a metadata field
        await supabase.from('profiles').update({
          last_active: new Date().toISOString()
        }).eq('id', user.id);
      };
      
      const timeoutId = setTimeout(syncLocation, 5000); // Debounce updates
      return () => clearTimeout(timeoutId);
    }
  }, [riderLocation, isOnline, user.id, activeOrder?.id]);

  const acceptOrder = async (orderId: string) => {
    // Check if order is already taken or cancelled
    const { data: order, error: fetchError } = await supabase.from('orders').select('status, rider_id').eq('id', orderId).single();
    
    if (fetchError) {
      console.error("Fetch order error:", fetchError);
      alert("Error checking order status");
      return;
    }

    if (order.status === 'Cancelled') {
      alert("This order has been cancelled and cannot be accepted.");
      return;
    }

    if (order.rider_id) {
      alert("This order has already been accepted by another rider.");
      return;
    }

    const { error } = await supabase.from('orders').update({ 
      rider_id: user.id, 
      status: 'Your Rider is on the way',
      rider_lat: riderLocation?.lat,
      rider_lng: riderLocation?.lng
    }).eq('id', orderId);

    if (error) {
      console.error("Accept error:", error);
      alert(`Accept Error: ${error.message}`);
    } else {
      fetchOrders();
    }
  };

  return (
    <div className="p-3 sm:p-4 max-w-4xl mx-auto space-y-3 sm:space-y-4">
      <div className="bg-slate-900 rounded-[24px] p-4 sm:p-6 text-white flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xl relative overflow-hidden">
        <div className="text-center sm:text-left w-full sm:w-auto">
          <h1 className="text-lg sm:text-xl font-black mb-1">Mabuhay, {user?.name?.split(' ')[0]}!</h1>
          <p className="text-slate-400 text-[10px] sm:text-xs font-medium">You are currently {isOnline ? 'active and ready' : 'offline'}.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
                onClick={onLogout}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-all text-[9px] font-black uppercase tracking-widest border border-red-600/20"
            >
                <LogOut size={12} /> Logout
            </button>
            <button onClick={toggleOnlineStatus} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg font-black text-[10px] transition-all shadow-lg active:scale-95 uppercase tracking-widest ${isOnline ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900'}`}>
            {isOnline ? 'ONLINE' : 'GO ONLINE'}
            </button>
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
          {activeOrder ? (
            <div className="bg-white p-3 sm:p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4 sm:space-y-6">
               <div className="flex justify-between items-center">
                 <div className="flex items-center gap-2">
                   <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Navigation2 size={14} className="sm:w-4 sm:h-4" /></div>
                   <h3 className="font-black text-slate-900 text-xs sm:text-base tracking-tight">Active Delivery</h3>
                 </div>
                 <span className="text-[8px] sm:text-[9px] font-black bg-slate-900 text-white px-2 py-1 rounded-full uppercase tracking-widest">#{activeOrder.id.slice(0,6).toUpperCase()}</span>
               </div>

               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="space-y-4">
                   <div className="flex gap-2 sm:gap-3">
                     <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center shrink-0"><Store size={12} className="sm:w-3.5 sm:h-3.5" /></div>
                     <div>
                       <p className="text-[7px] sm:text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Pharmacy Name</p>
                       <p className="font-black text-[10px] sm:text-xs text-slate-900 leading-tight">{activeOrder.pharmacies?.name || 'Pharmacy'}</p>
                     </div>
                   </div>

                   <div className="flex gap-2 sm:gap-3">
                     <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center shrink-0"><User size={12} className="sm:w-3.5 sm:h-3.5" /></div>
                     <div>
                       <p className="text-[7px] sm:text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Customer Name</p>
                       <p className="font-black text-[10px] sm:text-xs text-slate-900 leading-tight">{activeOrder.customer_name}</p>
                       <p className="text-[9px] sm:text-[10px] text-slate-500 font-medium line-clamp-1">{activeOrder.customer_address}</p>
                     </div>
                   </div>

                   <div className="flex gap-2 sm:gap-3">
                     <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center shrink-0"><Package size={12} className="sm:w-3.5 sm:h-3.5" /></div>
                     <div>
                       <p className="text-[7px] sm:text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Item Name</p>
                       <p className="font-black text-[10px] sm:text-xs text-slate-900 leading-tight line-clamp-2">{activeOrder.item_name || 'Medical Supplies'}</p>
                     </div>
                   </div>
                 </div>

                 <div className="space-y-4">
                   <div className="flex gap-2 sm:gap-3">
                     <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center shrink-0"><DollarSign size={12} className="sm:w-3.5 sm:h-3.5" /></div>
                     <div>
                       <p className="text-[7px] sm:text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Total Amount</p>
                       <p className="font-black text-[10px] sm:text-xs text-slate-900 leading-tight">₱{parseFloat(activeOrder.total).toFixed(2)}</p>
                     </div>
                   </div>

                   <div className="flex gap-2 sm:gap-3">
                     <div className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-50 text-slate-400 rounded-lg flex items-center justify-center shrink-0"><PaymentIcon size={12} className="sm:w-3.5 sm:h-3.5" /></div>
                     <div>
                       <p className="text-[7px] sm:text-[8px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Payment Method</p>
                       <p className="font-black text-[10px] sm:text-xs text-slate-900 leading-tight">{activeOrder.payment_method || 'Cash on Delivery'}</p>
                     </div>
                   </div>

                   <div className="pt-1 sm:pt-2 flex gap-2">
                      <button 
                        onClick={() => setIsChatOpen(true)}
                        className="flex items-center justify-center gap-2 flex-1 py-1.5 sm:py-2 bg-slate-50 text-slate-700 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200"
                      >
                        <MessageSquare size={10} className="sm:w-3" /> CHAT
                      </button>
                      <a 
                        href={`tel:${activeOrder.customer_profile?.mobile_number || activeOrder.customer_phone || activeOrder.rider_phone || '0000000000'}`}
                        className="flex items-center justify-center gap-2 flex-1 py-1.5 sm:py-2 bg-slate-50 text-slate-700 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200"
                      >
                        <Phone size={10} className="sm:w-3" /> CALL
                      </a>
                      <button 
                        onClick={() => setIsMapOpen(true)}
                        className="flex items-center justify-center gap-2 flex-1 py-1.5 sm:py-2 bg-blue-50 text-blue-600 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest hover:bg-blue-100 transition-all border border-blue-100"
                      >
                        <MapPin size={10} className="sm:w-3" /> LOCATION
                      </button>
                      <button 
                        onClick={() => setIsPaymentModalOpen(true)}
                        className="flex items-center justify-center gap-2 flex-1 py-1.5 sm:py-2 bg-indigo-50 text-indigo-700 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all border border-indigo-200"
                      >
                        <CreditCard size={10} className="sm:w-3" /> PAYMENT
                      </button>

                   </div>
                 </div>
               </div>

               <div className="pt-3 sm:pt-4 border-t border-slate-100 flex flex-col gap-2 sm:gap-3">
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                     <div className="flex items-center gap-2">
                        <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-emerald-500 rounded-full animate-ping" />
                        <div>
                          <p className="text-[8px] sm:text-[9px] font-black text-emerald-700 uppercase tracking-widest">Live GPS Tracking Active</p>
                          {riderLocation && (
                            <p className="text-[6px] sm:text-[7px] text-emerald-600 font-bold">
                              Current: {riderLocation.lat.toFixed(4)}, {riderLocation.lng.toFixed(4)}
                            </p>
                          )}
                        </div>
                     </div>
                     <Radar size={12} className="text-emerald-500 animate-pulse sm:w-3.5" />
                  </div>
                  <button 
                    onClick={async () => { 
                      if (!activeOrder) return;

                      const { error } = await supabase.from('orders').update({ status: 'Delivered' }).eq('id', activeOrder.id); 
                      if (error) {
                        console.error("Error completing delivery:", error);
                        alert(`Failed to complete delivery: ${error.message}`);
                      } else {
                        setActiveOrder(null);
                        fetchOrders(); 
                      }
                    }} 
                    className="w-full bg-slate-900 text-white py-3 sm:py-5 rounded-xl sm:rounded-2xl font-black hover:bg-emerald-600 transition-all shadow-xl active:scale-95 text-[9px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] border-b-4 sm:border-b-8 border-slate-950"
                  >
                    COMPLETE DELIVERY
                  </button>
               </div>
            </div>
          ) : (
            <div className="space-y-3">
               <h2 className="text-sm sm:text-base font-black flex items-center gap-2">Available Jobs</h2>
               {isOnline ? (
                 availableOrders.length > 0 ? (
                   availableOrders.map(order => (
                     <div key={order.id} className="bg-white p-3 sm:p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3 group">
                        <div className="space-y-0.5 overflow-hidden w-full">
                          <p className="font-black text-xs truncate">#{order.id.slice(0,6).toUpperCase()} • {order.pharmacies?.name}</p>
                          <p className="text-[10px] text-slate-500 line-clamp-1">{order.customer_address}</p>
                          <p className="text-[9px] font-black text-blue-600 uppercase">₱{parseFloat(order.total).toFixed(0)} Earnings</p>
                        </div>
                        <button onClick={() => acceptOrder(order.id)} className="w-full xs:w-auto bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-black hover:bg-blue-700 transition-all shadow-lg active:scale-95 border-b-2 border-blue-800 uppercase tracking-widest">ACCEPT</button>
                     </div>
                   ))
                 ) : (
                   <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-[24px]">
                     <p className="text-slate-400 text-xs font-medium">Scanning for orders...</p>
                   </div>
                 )
               ) : (
                 <div className="p-8 text-center bg-slate-50 rounded-[24px]">
                   <p className="text-slate-400 text-xs">Go online to receive jobs.</p>
                 </div>
               )}
            </div>
          )}
        </div>
      <MapModal 
        isOpen={isMapOpen} 
        onClose={() => setIsMapOpen(false)} 
        riderLocation={riderLocation} 
        customerLocation={
          (activeOrder?.lat != null && activeOrder?.lng != null)
            ? { lat: Number(activeOrder.lat), lng: Number(activeOrder.lng) } 
            : null
        }
        customerAddress={activeOrder?.customer_address || ''}
        customerId={activeOrder?.customer_id}
        riderId={activeOrder?.rider_id || ''}
      />
      {activeOrder && (
        <ChatModal 
          isOpen={isChatOpen} 
          onClose={() => setIsChatOpen(false)} 
          orderId={activeOrder.id} 
          user={user} 
        />
      )}
      {activeOrder && isPaymentModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={() => { setIsPaymentModalOpen(false); setSelectedPaymentMethod(null); }} />
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black text-lg text-slate-900">
                {selectedPaymentMethod ? `${PAYMENT_METHODS[selectedPaymentMethod].name} QR Code` : 'Select Payment Method'}
              </h3>
              <button onClick={() => { setIsPaymentModalOpen(false); setSelectedPaymentMethod(null); }} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>
            
            {selectedPaymentMethod ? (
              <div className="flex flex-col items-center gap-4">
                <img src={PAYMENT_METHODS[selectedPaymentMethod].qrCodeImgUrl} alt={`${selectedPaymentMethod} QR`} className="w-64 h-64" referrerPolicy="no-referrer" />
                <button onClick={() => setSelectedPaymentMethod(null)} className="text-blue-600 text-xs font-black uppercase tracking-widest">Back to Methods</button>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(PAYMENT_METHODS).map(([key, method]) => (
                  <button 
                    key={key}
                    onClick={() => setSelectedPaymentMethod(key as keyof typeof PAYMENT_METHODS)}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-100 transition-all group ${
                      method.color === 'blue' 
                        ? 'hover:border-blue-500 hover:bg-blue-50' 
                        : 'hover:border-indigo-500 hover:bg-indigo-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden ${
                        method.color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-indigo-100 text-indigo-600'
                      }`}>
                        <img src={method.iconUrl} alt={method.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <span className={`font-bold text-slate-700 ${
                        method.color === 'blue' ? 'group-hover:text-blue-700' : 'group-hover:text-indigo-700'
                      }`}>{method.name}</span>
                    </div>
                    <ChevronRight size={16} className={`text-slate-300 ${
                      method.color === 'blue' ? 'group-hover:text-blue-500' : 'group-hover:text-indigo-500'
                    }`} />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
};

// --- Chat Modal ---

const ChatModal = ({ isOpen, onClose, orderId, user }: { isOpen: boolean, onClose: () => void, orderId: string, user: any }) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    const { data } = await supabase.from('chat_messages').select('*').eq('order_id', orderId).order('created_at', { ascending: true });
    if (data) setMessages(data);
  };

  useEffect(() => {
    if (isOpen && orderId) {
      fetchMessages();
      const channel = supabase.channel(`chat_messages-${orderId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `order_id=eq.${orderId}` }, (payload) => {
          setMessages(prev => [...prev, payload.new]);
        }).subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [isOpen, orderId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg = newMessage;
    setNewMessage('');

    const senderType = user.role === 'pharmacy_admin' ? 'pharmacy' : user.role;

    const { error } = await supabase.from('chat_messages').insert([{
      order_id: orderId,
      sender_id: user.id,
      sender_type: senderType,
      content: msg
    }]);

    if (error) {
      console.error("Chat send error:", error);
      alert("Failed to send message. Please try again.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 bg-slate-900/80 backdrop-blur-2xl">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white w-full max-w-md h-[600px] rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-black text-sm uppercase tracking-widest text-slate-700 flex items-center gap-2">
            <MessageSquare size={16} className="text-blue-600"/> Chat
          </h3>
          <button onClick={onClose} className="bg-white p-2 rounded-full shadow-sm hover:bg-slate-200 transition-colors"><X size={16} /></button>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-slate-400 text-xs font-medium">No messages yet.</p>
            </div>
          ) : (
            messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender_id === user.id ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${msg.sender_id === user.id ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'}`}>
                  <p>{msg.content}</p>
                  <p className={`text-[9px] mt-1 opacity-70 ${msg.sender_id === user.id ? 'text-blue-100' : 'text-slate-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={sendMessage} className="p-3 bg-white border-t border-slate-200 flex gap-2">
          <input 
            type="text" 
            placeholder="Type a message..." 
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none focus:border-blue-400 font-medium"
            value={newMessage}
            onChange={e => setNewMessage(e.target.value)}
          />
          <button type="submit" disabled={!newMessage.trim()} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-lg shadow-blue-200">
            <Send size={18} />
          </button>
        </form>
      </motion.div>
    </div>
  );
};

// --- Pharmacy Portal ---

const PharmacyPortal = ({ user, onLogout }: { user: any, onLogout: () => void }) => {
  const [pharmacy, setPharmacy] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [inventory, setInventory] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'settings'>('dashboard');
  const [isSaving, setIsSaving] = useState(false);
  const [incomingAlert, setIncomingAlert] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [chatOrderId, setChatOrderId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const fetchPortalData = useCallback(async () => {
    try {
      const phRes = await fetchWithRetry(() => supabase.from('pharmacies').select('*').eq('admin_id', user.id).maybeSingle());
      if (phRes.data) {
        setPharmacy(phRes.data);
        const [ordRes, invRes] = await Promise.all([
          fetchWithRetry(() => supabase.from('orders').select('*').eq('pharmacy_id', phRes.data.id).order('created_at', { ascending: false })),
          fetchWithRetry(() => supabase.from('products').select('*').eq('pharmacy_id', phRes.data.id).order('name', { ascending: true }))
        ]);
        
        let orders = ordRes.data || [];
        const riderIds = [...new Set(orders.map((o: any) => o.rider_id).filter(Boolean))];
        
        if (riderIds.length > 0) {
            const { data: riders } = await supabase.from('profiles').select('id, full_name').in('id', riderIds);
            const riderMap = new Map(riders?.map(r => [r.id, r]));
            orders = orders.map((o: any) => ({
                ...o,
                rider: o.rider_id ? riderMap.get(o.rider_id) : null
            }));
        }

        console.log("Fetched Inventory:", invRes.data);
        setOrders(orders);
        setInventory(invRes.data || []);
      }
    } catch (e) {
      console.error("Pharmacy sync error:", e);
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    fetchPortalData();
    const ch = supabase.channel(`live-feed-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        if (payload.eventType === 'INSERT' && payload.new.pharmacy_id === pharmacy?.id) {
          setIncomingAlert(true);
          setTimeout(() => setIncomingAlert(false), 5000);
        }
        fetchPortalData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, fetchPortalData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user.id, pharmacy?.id, fetchPortalData]);

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Remove this item?")) return;
    await supabase.from('products').delete().eq('id', id);
    fetchPortalData();
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingOrderId(orderId);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
      if (error) throw error;
      await fetchPortalData();
    } catch (e) {
      console.error("Status update error:", e);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const togglePharmacyStatus = async () => {
    if (!pharmacy) return;
    const newStatus = !pharmacy.is_open;
    try {
      const { error } = await supabase.from('pharmacies').update({ is_open: newStatus }).eq('id', pharmacy.id);
      if (error) throw error;
      setPharmacy({ ...pharmacy, is_open: newStatus });
    } catch (e) {
      console.error("Status toggle error:", e);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pharmacy) return;
    setIsSaving(true);
    try {
      const { error } = await supabase.from('pharmacies').update({
        name: pharmacy.name,
        category: pharmacy.category,
        image_url: pharmacy.image_url
      }).eq('id', pharmacy.id);
      
      if (error) throw error;
      alert("Settings updated successfully!");
      fetchPortalData();
    } catch (e: any) {
      console.error("Settings update error:", e);
      alert("Failed to update settings: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredOrders = orders.filter(o => {
    const name = o.customer_name || '';
    const id = o.id || '';
    const item = o.item_name || '';
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || id.toLowerCase().includes(query) || item.toLowerCase().includes(query);
  });

  const filteredInventory = inventory.filter(item => {
    const name = item.name || '';
    const desc = item.description || '';
    const query = searchQuery.toLowerCase();
    return name.toLowerCase().includes(query) || desc.toLowerCase().includes(query);
  });

  const RealTimeLog = ({ isSidebar = false }: { isSidebar?: boolean }) => (
    <div className={`bg-white rounded-2xl border border-slate-200 shadow-sm ${isSidebar ? 'p-3' : 'p-4'} flex flex-col h-full`}>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
          <Activity size={16} className="text-indigo-600"/> 
          Recent Activity
        </h4>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 rounded-full">
           <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
           <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-wider">Live</span>
        </div>
      </div>

      <div className="space-y-3 overflow-y-auto pr-1 custom-scrollbar">
        {orders.slice(0, 15).map(o => (
          <div key={o.id} className="group flex flex-col gap-2 p-3 rounded-xl border border-slate-100 bg-slate-50/30 hover:bg-white hover:border-indigo-100 hover:shadow-md transition-all duration-200">
            <div className="flex justify-between items-start gap-3">
              <div className="flex gap-2.5 flex-1 overflow-hidden">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 shadow-sm ${o.status === 'Delivered' ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                  {o.status === 'Delivered' ? <CheckCircle2 size={14}/> : <History size={14}/>}
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[11px] font-bold text-slate-900">#{o.id.slice(0,6).toUpperCase()}</p>
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${o.status === 'pending' ? 'bg-amber-100 text-amber-700' : (o.status === 'preparing' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600')}`}>
                      {o.status}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium truncate">{o.customer_name || 'Patient'}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                  <p className="text-[11px] font-bold text-slate-900">₱{parseFloat(o.total || "0").toLocaleString()}</p>
                  <p className="text-[8px] text-slate-400 font-medium mt-0.5">
                    {o.item_name || 'Medical'}
                  </p>
              </div>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
              <Package size={24} />
            </div>
            <p className="text-slate-400 text-xs font-medium">No recent activity found</p>
          </div>
        )}
      </div>
    </div>
  );

  if (loading && !pharmacy) return (
    <div className="h-screen flex items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="animate-spin text-indigo-600" size={48} />
        <p className="text-slate-500 font-medium animate-pulse">Loading Dashboard...</p>
      </div>
    </div>
  );

  const stats = [
    { label: 'Total Revenue', value: `₱${orders.filter(o => o.status === 'Delivered').reduce((acc, o) => acc + parseFloat(o.total || "0"), 0).toLocaleString()}`, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Active Orders', value: orders.filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled').length, icon: ShoppingBag, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: 'Inventory Items', value: inventory.length, icon: Package, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Low Stock', value: inventory.filter(i => i.stock_quantity < 10).length, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-60 bg-white border-r border-slate-200 flex flex-col shrink-0 z-50">
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Store size={18} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 leading-tight truncate max-w-[110px] text-sm">{pharmacy?.name}</h2>
              <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Pharmacy Admin</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'inventory', label: 'Inventory', icon: Package },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id as any)} 
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
            >
              <tab.icon size={16} className={activeTab === tab.id ? 'text-indigo-600' : 'text-slate-400'} />
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-100">
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-red-500 hover:bg-red-50 transition-all duration-200"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sm:px-8 shrink-0 z-40">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold text-slate-900 capitalize">{activeTab}</h1>
            <div className="h-4 w-[1px] bg-slate-200 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${pharmacy?.is_open ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className="text-[11px] font-semibold text-slate-500">{pharmacy?.is_open ? 'Accepting Orders' : 'Store Closed'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={togglePharmacyStatus} 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold transition-all duration-200 shadow-sm ${pharmacy?.is_open ? 'bg-emerald-500 text-white hover:bg-emerald-600' : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'}`}
            >
              <Power size={12} />
              {pharmacy?.is_open ? 'Online' : 'Offline'}
            </button>
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden">
              <img src={pharmacy?.image_url} className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="max-w-[1400px] mx-auto space-y-6"
            >
              {activeTab === 'dashboard' && (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {stats.map((stat, i) => (
                        <div key={i} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                          <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                            <stat.icon size={20} />
                          </div>
                          <p className="text-[11px] font-medium text-slate-500 mb-0.5">{stat.label}</p>
                          <h3 className="text-xl font-bold text-slate-900">{stat.value}</h3>
                        </div>
                      ))}
                    </div>

                    {/* Inventory Preview */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900 text-sm">Inventory Overview</h3>
                        <button onClick={() => setActiveTab('inventory')} className="text-indigo-600 text-[11px] font-bold hover:underline">View All</button>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="bg-slate-50/50 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                              <th className="px-4 py-3">Product</th>
                              <th className="px-4 py-3">Price</th>
                              <th className="px-4 py-3">Stock</th>
                              <th className="px-4 py-3">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {inventory.slice(0, 5).map(item => (
                              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-2.5">
                                    <img src={item.image_url} className="w-7 h-7 rounded-lg object-cover" />
                                    <span className="text-xs font-semibold text-slate-700">{item.name}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs font-medium text-slate-600">₱{parseFloat(item.price).toFixed(0)}</td>
                                <td className="px-4 py-3 text-xs font-medium text-slate-600">{item.stock_quantity}</td>
                                <td className="px-4 py-3">
                                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${item.stock_quantity > 10 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    {item.stock_quantity > 10 ? 'In Stock' : 'Low Stock'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Activity */}
                  <div className="xl:col-span-1">
                    <RealTimeLog />
                  </div>
                </div>
              )}

              {activeTab === 'inventory' && (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="relative w-full sm:max-w-md">
                      <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search medicines, equipment..." 
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl font-medium text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <button onClick={() => { setEditingProduct(null); setIsProductModalOpen(true); }} className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all active:scale-95">
                      <Plus size={16} /> Register Item
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3">
                    {filteredInventory.length > 0 ? (
                      filteredInventory.map(item => (
                        <div key={item.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                          <div className="h-32 relative overflow-hidden bg-slate-100">
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="absolute top-2 right-2 flex gap-1 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                              <button onClick={() => { setEditingProduct(item); setIsProductModalOpen(true); }} className="p-1.5 bg-white text-slate-900 rounded-lg shadow-lg hover:bg-indigo-600 hover:text-white transition-all"><Edit2 size={12}/></button>
                              <button onClick={() => handleDeleteProduct(item.id)} className="p-1.5 bg-white text-red-600 rounded-lg shadow-lg hover:bg-red-600 hover:text-white transition-all"><Trash2 size={12}/></button>
                            </div>
                          </div>
                          <div className="p-3 space-y-2">
                            <div>
                              <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate text-xs">{item.name}</h4>
                              <p className="text-[10px] text-slate-500 font-medium line-clamp-2 mt-0.5 h-6 leading-tight">{item.description}</p>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                              <p className="text-sm font-bold text-slate-900">₱{parseFloat(item.price).toLocaleString()}</p>
                              <div className="text-right">
                                <p className={`text-[8px] font-bold uppercase tracking-wider ${item.stock_quantity < 10 ? 'text-red-500' : 'text-emerald-500'}`}>
                                  {item.stock_quantity < 10 ? 'Low' : 'In Stock'}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400">{item.stock_quantity} u</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-16 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-3">
                          <Package size={24} />
                        </div>
                        <h3 className="text-slate-900 font-bold text-sm">No products found</h3>
                        <p className="text-slate-500 text-xs mt-1">Try adjusting your search or add a new item.</p>
                        <button onClick={() => setIsProductModalOpen(true)} className="mt-4 bg-indigo-50 text-indigo-600 px-5 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors">Add New Item</button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <div className="max-w-xl mx-auto">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                        <Settings size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">Store Profile</h3>
                        <p className="text-xs text-slate-500 font-medium">Update your pharmacy information and branding.</p>
                      </div>
                    </div>
                    <form onSubmit={handleUpdateSettings} className="p-6 space-y-5">
                      <div className="grid grid-cols-1 gap-5">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Pharmacy Name</label>
                          <input required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={pharmacy?.name || ''} onChange={e => setPharmacy({...pharmacy, name: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Grid Category</label>
                          <input required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={pharmacy?.category || ''} onChange={e => setPharmacy({...pharmacy, category: e.target.value})} />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">Store Profile Image URL</label>
                          <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-xl border border-slate-200 overflow-hidden shrink-0">
                              <img src={pharmacy?.image_url} className="w-full h-full object-cover" />
                            </div>
                            <input required className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-xs outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all" value={pharmacy?.image_url || ''} onChange={e => setPharmacy({...pharmacy, image_url: e.target.value})} />
                          </div>
                        </div>
                      </div>
                      <div className="pt-2">
                        <button disabled={isSaving} type="submit" className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold text-xs shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
                          {isSaving ? 'Saving Changes...' : 'Update Profile'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <ProductModal 
        isOpen={isProductModalOpen} 
        onClose={() => { setIsProductModalOpen(false); setEditingProduct(null); }} 
        pharmacyId={pharmacy?.id} 
        product={editingProduct} 
        onSuccess={fetchPortalData} 
      />
      <ChatModal 
        isOpen={isChatOpen} 
        onClose={() => { setIsChatOpen(false); setChatOrderId(null); }} 
        orderId={chatOrderId || ''} 
        user={user} 
      />
    </div>
  );
};

// --- Partnership Section ---






// --- Map Modal ---

const RoutingPath = ({ riderLocation, customerLocation, color = "#EF4444" }: { 
  riderLocation: { lat: number, lng: number } | null, 
  customerLocation: { lat: number, lng: number } | null,
  color?: string
}) => {
  const [path, setPath] = useState<[number, number][]>([]);
  const lastFetchedLoc = useRef<{lat: number, lng: number} | null>(null);
  const lastFetchedCustomerLoc = useRef<{lat: number, lng: number} | null>(null);

  useEffect(() => {
    if (!riderLocation || !customerLocation) {
      setPath([]);
      return;
    }
    
    let shouldFetch = false;
    if (!lastFetchedLoc.current || !lastFetchedCustomerLoc.current) {
      shouldFetch = true;
    } else {
      // Fetch new route only if rider moved significantly (~1 meter) or customer location changed
      const dLat = Math.abs(riderLocation.lat - lastFetchedLoc.current.lat);
      const dLng = Math.abs(riderLocation.lng - lastFetchedLoc.current.lng);
      
      const cLat = Math.abs(customerLocation.lat - lastFetchedCustomerLoc.current.lat);
      const cLng = Math.abs(customerLocation.lng - lastFetchedCustomerLoc.current.lng);
      
      if (dLat > 0.000009 || dLng > 0.000009 || cLat > 0 || cLng > 0) {
        shouldFetch = true;
      }
    }

    if (!shouldFetch) {
      return; // Keep existing path if locations haven't moved much
    }

    lastFetchedLoc.current = riderLocation;
    lastFetchedCustomerLoc.current = customerLocation;

    // Set initial straight line path while loading
    if (path.length === 0) {
      setPath([[riderLocation.lat, riderLocation.lng], [customerLocation.lat, customerLocation.lng]]);
    }

    const fetchRoute = async () => {
      try {
        const url = `/api/route?start_lng=${riderLocation.lng}&start_lat=${riderLocation.lat}&end_lng=${customerLocation.lng}&end_lat=${customerLocation.lat}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
          const coordinates = data.features[0].geometry.coordinates;
          const leafletPath: [number, number][] = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
          setPath(leafletPath);
        } else if (data.routes && data.routes.length > 0) {
          // Fallback in case the endpoint still returns OSRM format or similar
          const coordinates = data.routes[0].geometry.coordinates;
          const leafletPath: [number, number][] = coordinates.map((coord: [number, number]) => [coord[1], coord[0]]);
          setPath(leafletPath);
        }
      } catch (error) {
        console.error("Error fetching route:", error);
      }
    };

    fetchRoute();
  }, [riderLocation?.lat, riderLocation?.lng, customerLocation?.lat, customerLocation?.lng]);

  if (path.length === 0) return null;

  return (
    <>
      <Polyline positions={path} color={color} weight={6} opacity={0.4} />
      <Polyline positions={path} color={color} weight={3} opacity={1} />
    </>
  );
};

const FitBounds = ({ markers, trigger }: { markers: [number, number][], trigger?: number }) => {
  const map = useMap();
  const hasFit = useRef(false);

  useEffect(() => {
    if (markers.length > 0 && !hasFit.current) {
      const bounds = L.latLngBounds(markers.map(m => L.latLng(m[0], m[1])));
      map.fitBounds(bounds, { padding: [50, 50] });
      hasFit.current = true;
    }
  }, [markers, map]);

  useEffect(() => {
    if (trigger && trigger > 0 && markers.length > 0) {
      const bounds = L.latLngBounds(markers.map(m => L.latLng(m[0], m[1])));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [trigger, markers, map]);

  return null;
};

const MapModal = ({ isOpen, onClose, riderLocation, customerLocation, customerAddress, customerId, riderId }: { 
  isOpen: boolean, 
  onClose: () => void, 
  riderLocation: { lat: number, lng: number } | null, 
  customerLocation: { lat: number, lng: number } | null,
  customerAddress: string,
  customerId?: string,
  riderId: string
}) => {
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  if (!isOpen) return null;

  const hasLocation = customerLocation || riderLocation;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 bg-slate-900/80 backdrop-blur-2xl">
      <div className="absolute inset-0" onClick={onClose} />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white w-full max-w-4xl h-[80vh] rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
          <button onClick={onClose} className="bg-white p-2 rounded-full shadow-lg hover:bg-slate-100 transition-colors"><X size={24} /></button>
          {hasLocation && (
            <button onClick={() => setRecenterTrigger(prev => prev + 1)} className="bg-white p-2 rounded-full shadow-lg hover:bg-slate-100 transition-colors" title="Recenter Map">
              <MapPin size={24} className="text-blue-600" />
            </button>
          )}
        </div>
        
        <div className="flex-1 relative z-0">
          {hasLocation ? (
            <RiderTrackingMap 
              customerLocation={customerLocation} 
              customerAddress={customerAddress}
              customerId={customerId}
              riderLocationProp={riderLocation}
              riderId={riderId} 
              supabase={supabase}
              recenterTrigger={recenterTrigger}
            />
          ) : (
            <div className="h-full flex items-center justify-center flex-col gap-4">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-slate-500 font-medium">Initializing tracking grid...</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// --- Login Modal ---

const LoginModal = ({ isOpen, onClose, onLoginSuccess, initialRole }: { isOpen: boolean, onClose: () => void, onLoginSuccess: (user: any) => void, initialRole?: string }) => {
  const [formData, setFormData] = useState({ email: '', password: '', role: initialRole || 'pharmacy_admin' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialRole) {
      setFormData(prev => ({ ...prev, role: initialRole }));
    }
  }, [isOpen, initialRole]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('email', formData.email.trim()).eq('password', formData.password).eq('role', formData.role);
      
      if (error || !data?.[0]) throw new Error("Invalid medical grid credentials.");
      
      const user = data[0];
      
      const localProfileOverrides = JSON.parse(localStorage.getItem('medgo_profile_overrides') || '{}');
      const localUserOverride = localProfileOverrides[user.id];
      const effectiveStatus = localUserOverride?.status || user.status;
      
      if (['rider', 'pharmacy_admin'].includes(user.role)) {
          if (effectiveStatus !== 'approved') {
              throw new Error("Account pending approval. Please wait for administrator verification.");
          }
      }

      onLoginSuccess({ id: user.id, name: user.full_name, role: user.role, email: user.email });
      onClose();
    } catch (err: any) { setErrorMsg(err.message); } finally { setIsSubmitting(false); }
  };

  if (!isOpen) return null;

  const isRider = formData.role === 'rider';
  const themeColor = isRider ? 'emerald' : 'indigo';
  const Icon = isRider ? Bike : Store;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 bg-slate-900/40 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        className="relative bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-slate-100"
      >
        {/* Header Accent */}
        <div className={`h-2 w-full bg-${themeColor}-600`} />
        
        <div className="p-8 sm:p-10">
          <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-slate-900 transition-colors bg-slate-50 p-2 rounded-full"><X size={18} /></button>
          
          <div className="flex flex-col items-center text-center mb-10">
            <div className={`w-16 h-16 rounded-2xl bg-${themeColor}-50 flex items-center justify-center text-${themeColor}-600 mb-6 shadow-sm border border-${themeColor}-100`}>
              <Icon size={32} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
              {isRider ? 'Rider Portal' : 'Pharmacy Portal'}
            </h3>
            <p className="text-sm text-slate-500 font-medium">Enter your credentials to access your dashboard</p>
          </div>

          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-semibold border border-red-100 flex items-center gap-3"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              {errorMsg}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input 
                  required 
                  type="email" 
                  placeholder="name@company.com" 
                  className={`w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-medium text-sm outline-none focus:bg-white focus:ring-4 focus:ring-${themeColor}-50 focus:border-${themeColor}-200 transition-all`} 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                <input 
                  required 
                  type="password" 
                  placeholder="••••••••" 
                  className={`w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-medium text-sm outline-none focus:bg-white focus:ring-4 focus:ring-${themeColor}-50 focus:border-${themeColor}-200 transition-all`} 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                />
              </div>
            </div>

            <button 
              disabled={isSubmitting} 
              type="submit" 
              className={`w-full bg-${themeColor}-600 text-white py-4 rounded-2xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-${themeColor}-200 mt-6 hover:bg-${themeColor}-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3`}
            >
              {isSubmitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>Sign In to Portal <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-50 text-center">
            <p className="text-xs text-slate-400">
              Secured by MedGO Enterprise Grid
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Admin Portal ---

// --- Customer Tracking View ---

const CustomerTrackingView = ({ riderLocation, customerLocation, customerAddress, recenterTrigger }: { 
  riderLocation: { lat: number, lng: number } | null, 
  customerLocation: { lat: number, lng: number } | null,
  customerAddress: string,
  recenterTrigger?: number
}) => {
  const adjustedRiderLocation = React.useMemo(() => {
    if (riderLocation && customerLocation && riderLocation.lat === customerLocation.lat && riderLocation.lng === customerLocation.lng) {
      return { lat: riderLocation.lat + 0.0001, lng: riderLocation.lng + 0.0001 };
    }
    return riderLocation;
  }, [riderLocation, customerLocation]);

  const markers = React.useMemo(() => {
    const pts: [number, number][] = [];
    if (adjustedRiderLocation && !isNaN(adjustedRiderLocation.lat) && !isNaN(adjustedRiderLocation.lng)) {
      pts.push([adjustedRiderLocation.lat, adjustedRiderLocation.lng]);
    }
    if (customerLocation && !isNaN(customerLocation.lat) && !isNaN(customerLocation.lng)) {
      pts.push([customerLocation.lat, customerLocation.lng]);
    }
    return pts;
  }, [adjustedRiderLocation, customerLocation]);

  return (
    <div className="w-full h-full relative">
      <MapContainer 
        center={markers.length > 0 ? markers[0] : [14.5995, 120.9842]} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <FitBounds markers={markers} trigger={recenterTrigger} />
        <RoutingPath riderLocation={adjustedRiderLocation} customerLocation={customerLocation} color="#2563eb" />
        
        {adjustedRiderLocation && !isNaN(adjustedRiderLocation.lat) && (
          <Marker 
            position={[adjustedRiderLocation.lat, adjustedRiderLocation.lng]}
            icon={L.divIcon({
              className: 'custom-div-icon',
              html: `<div class="w-10 h-10 bg-blue-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-white">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M16 16c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2"/><circle cx="12" cy="7" r="4"/><path d="M7 21h10"/><path d="M12 18v3"/></svg>
                    </div>`,
              iconSize: [40, 40],
              iconAnchor: [20, 20]
            })}
          >
            <Popup>
              <div className="p-1">
                <p className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-1">Your Rider</p>
                <p className="font-bold text-xs text-slate-900">On the way to you</p>
              </div>
            </Popup>
          </Marker>
        )}

        {customerLocation && !isNaN(customerLocation.lat) && (
          <Marker 
            position={[customerLocation.lat, customerLocation.lng]}
            icon={L.divIcon({
              className: 'custom-div-icon',
              html: `<div class="w-10 h-10 bg-red-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-white">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>`,
              iconSize: [40, 40],
              iconAnchor: [20, 20]
            })}
          >
            <Popup>
              <div className="p-1">
                <p className="font-black text-[10px] uppercase tracking-widest text-slate-400 mb-1">Delivery Destination</p>
                <p className="font-bold text-xs text-slate-900">{customerAddress}</p>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

// --- Customer Portal ---

const CustomerPortal = ({ user, onLogout }: { user: any, onLogout: () => void }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOrder, setActiveOrder] = useState<any | null>(null);
  const [riderLocation, setRiderLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [customerLocation, setCustomerLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);
  const [recenterTrigger, setRecenterTrigger] = useState(0);

  const fetchAddresses = async () => {
    const { data } = await supabase.from('user_addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false });
    if (data) setAddresses(data);
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('customer_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      if (data) {
        setOrders(data);
        const active = data.find(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
        setActiveOrder(active || null);
      }
    } catch (e) {
      console.error("Fetch orders error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchAddresses();
    const channel = supabase.channel('customer-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `customer_id=eq.${user.id}` }, fetchOrders)
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [user.id]);

  useEffect(() => {
    const fetchCustomerLoc = async () => {
      if (activeOrder?.customer_address) {
        const { data } = await supabase.from('user_addresses')
          .select('*')
          .eq('user_id', user.id)
          .eq('address', activeOrder.customer_address)
          .maybeSingle();
          
        if (data && data.lat != null && data.lng != null) {
          setCustomerLocation({ lat: Number(data.lat), lng: Number(data.lng) });
          return;
        }
      }
      
      const { data } = await supabase.from('user_addresses').select('*').eq('user_id', user.id).eq('is_default', true).maybeSingle();
      if (data && data.lat != null && data.lng != null) {
        setCustomerLocation({ lat: Number(data.lat), lng: Number(data.lng) });
      }
    };
    fetchCustomerLoc();
  }, [user.id, activeOrder?.customer_address]);

  useEffect(() => {
    if (activeOrder?.rider_lat != null && activeOrder?.rider_lng != null) {
      setRiderLocation({ lat: Number(activeOrder.rider_lat), lng: Number(activeOrder.rider_lng) });
    } else {
      setRiderLocation(null);
    }
  }, [activeOrder?.rider_lat, activeOrder?.rider_lng]);

  return (
    <div className="p-3 sm:p-4 max-w-4xl mx-auto space-y-3 sm:space-y-4">
      <div className="bg-slate-900 rounded-[24px] p-4 sm:p-6 text-white flex flex-col sm:flex-row justify-between items-center gap-4 shadow-xl relative overflow-hidden">
        <div className="text-center sm:text-left w-full sm:w-auto">
          <h1 className="text-lg sm:text-xl font-black mb-1">Hello, {user?.name?.split(' ')[0] || 'Patient'}!</h1>
          <p className="text-slate-400 text-[10px] sm:text-xs font-medium">Track your medical deliveries in real-time.</p>
        </div>
        <button 
            onClick={onLogout}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-red-600/20"
        >
            <LogOut size={14} /> Logout
        </button>
      </div>

      {activeOrder ? (
        <div className="bg-white p-4 sm:p-6 rounded-[24px] border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center"><Truck size={16} /></div>
              <h3 className="font-black text-slate-900 text-sm sm:text-base tracking-tight">Active Order</h3>
            </div>
            <span className="text-[9px] font-black bg-slate-900 text-white px-2 py-1 rounded-full uppercase tracking-widest">#{activeOrder.id.slice(0,6).toUpperCase()}</span>
          </div>

          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
              <div>
                <p className="text-[10px] font-black text-blue-700 uppercase tracking-widest">{activeOrder.status}</p>
                <p className="text-[8px] text-blue-600 font-bold uppercase">Live Tracking Enabled</p>
              </div>
            </div>
            <button 
              onClick={() => setIsMapOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              Track on Map
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Item</p>
              <p className="font-bold text-xs text-slate-900">{activeOrder.item_name || 'Medical Supplies'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Total</p>
              <p className="font-bold text-xs text-slate-900">₱{parseFloat(activeOrder.total).toFixed(2)}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setIsChatOpen(true)}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all border border-slate-200"
            >
              <MessageSquare size={14} /> Chat with Rider
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-8 text-center rounded-[24px] border border-slate-100 shadow-sm">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag size={24} className="text-slate-300" />
          </div>
          <h3 className="font-bold text-slate-900 mb-1">No active orders</h3>
          <p className="text-slate-500 text-xs">Your active medical deliveries will appear here.</p>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-black text-sm uppercase tracking-tight flex items-center gap-2">
            <MapPin size={16} className="text-blue-600" /> Delivery Addresses
          </h3>
          <button 
            onClick={() => { setEditingAddress(null); setIsAddressModalOpen(true); }}
            className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline"
          >
            Add New
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {addresses.map(addr => (
            <div key={addr.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-start group">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-xs text-slate-900">{addr.address}</p>
                  {addr.is_default && (
                    <span className="text-[8px] font-black bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded uppercase tracking-widest">Default</span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => { setEditingAddress(addr); setIsAddressModalOpen(true); }}
                className="p-2 text-slate-300 hover:text-blue-600 transition-colors opacity-0 group-hover:opacity-100"
              >
                <Edit2 size={14} />
              </button>
            </div>
          ))}
          {addresses.length === 0 && (
            <div className="col-span-full bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 text-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No addresses saved</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-black text-sm uppercase tracking-tight flex items-center gap-2">
          <History size={16} className="text-blue-600" /> Order History
        </h3>
        <div className="space-y-2">
          {orders.filter(o => o.status === 'Delivered' || o.status === 'Cancelled').map(order => (
            <div key={order.id} className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${order.status === 'Delivered' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {order.status === 'Delivered' ? <CheckCircle2 size={16} /> : <X size={16} />}
                </div>
                <div>
                  <p className="font-bold text-xs text-slate-900">#{order.id.slice(0,6).toUpperCase()}</p>
                  <p className="text-[9px] text-slate-500 font-medium">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <p className="font-black text-xs text-slate-900">₱{parseFloat(order.total).toFixed(2)}</p>
            </div>
          ))}
          {orders.filter(o => o.status === 'Delivered' || o.status === 'Cancelled').length === 0 && (
            <p className="text-center py-6 text-slate-400 text-[10px] font-bold uppercase tracking-widest">No previous orders</p>
          )}
        </div>
      </div>

      {activeOrder && (
        <>
          {isMapOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 bg-slate-900/80 backdrop-blur-2xl">
              <div className="absolute inset-0" onClick={() => setIsMapOpen(false)} />
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="relative bg-white w-full max-w-4xl h-[80vh] rounded-[32px] shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
                <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
                  <button onClick={() => setIsMapOpen(false)} className="bg-white p-2 rounded-full shadow-lg hover:bg-slate-100 transition-colors"><X size={24} /></button>
                  <button onClick={() => setRecenterTrigger(prev => prev + 1)} className="bg-white p-2 rounded-full shadow-lg hover:bg-slate-100 transition-colors" title="Recenter Map">
                    <MapPin size={24} className="text-blue-600" />
                  </button>
                </div>
                <div className="flex-1 relative z-0">
                  <CustomerTrackingView 
                    riderLocation={riderLocation} 
                    customerLocation={customerLocation}
                    customerAddress={activeOrder.customer_address || ''}
                    recenterTrigger={recenterTrigger}
                  />
                </div>
                <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center">
                  <div>
                    <h3 className="font-black text-lg">Live Tracking</h3>
                    <p className="text-xs text-slate-500 font-medium">Real-time rider location updates active.</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="flex gap-4">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-600 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Rider</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-600 rounded-full" />
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">You</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setRecenterTrigger(prev => prev + 1)}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all"
                    >
                      Recenter
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
          <ChatModal 
            isOpen={isChatOpen} 
            onClose={() => setIsChatOpen(false)} 
            orderId={activeOrder.id} 
            user={user} 
          />
        </>
      )}

      <AddressModal 
        isOpen={isAddressModalOpen} 
        onClose={() => setIsAddressModalOpen(false)} 
        userId={user.id} 
        address={editingAddress} 
        onSuccess={fetchAddresses} 
      />
    </div>
  );
};

const AdminPortal = ({ user, onLogout }: { user: any, onLogout: () => void }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'riders' | 'pharmacies' | 'users'>('dashboard');
  const [applications, setApplications] = useState<any[]>([]);
  const [dashboardData, setDashboardData] = useState<{
      openPharmacies: any[];
      allPharmacies: any[];
      approvedRiders: any[];
  }>({ openPharmacies: [], allPharmacies: [], approvedRiders: [] });
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({ 
      userAccounts: 0, 
      onlineStores: 0, 
      onlineRiders: 0,
      dbStatus: 'Unknown',
      lastSync: null as Date | null,
      latency: 0
  });
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [adminName, setAdminName] = useState(user?.user_metadata?.full_name || 'Admin');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchRecentActivity = async () => {
    try {
      const { data: recentOrders } = await supabase
        .from('orders')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(5);
      
      const { data: recentRiderApps } = await supabase
        .from('rider_applications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      const { data: recentPharmApps } = await supabase
        .from('pharmacy_applications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      const activity = [
        ...(recentOrders || []).map(o => ({ ...o, type: 'order', label: `Order #${o.id.slice(0,6)}`, detail: `Status: ${o.status}` })),
        ...(recentRiderApps || []).map(a => ({ ...a, type: 'rider_app', label: `Rider App: ${a.full_name}`, detail: `Status: ${a.status}` })),
        ...(recentPharmApps || []).map(a => ({ ...a, type: 'pharm_app', label: `Pharm App: ${a.pharmacy_name}`, detail: `Status: ${a.status}` }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 8);

      setRecentActivity(activity);
    } catch (error) {
      console.error("Error fetching activity:", error);
    }
  };

  useEffect(() => {
      const fetchAdminProfile = async () => {
          if (user?.id) {
              const { data } = await supabase.from('profiles').select('full_name').eq('id', user.id).single();
              if (data?.full_name) setAdminName(data.full_name);
          }
      };
      fetchAdminProfile();
  }, [user]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    const startTime = performance.now();
    try {
        // 1. Fetch All Profiles (for User Accounts)
        const { count: totalProfiles, error: profileError } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true });

        // 2. Fetch Pharmacies (for Online Stores)
        const { data: pharmacies, error: pharmError } = await supabase
            .from('pharmacies')
            .select('*');
        
        // 3. Fetch Approved Riders (for Online Riders & Dashboard List)
        const { data: riders, error: riderError } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'rider')
            .eq('status', 'approved');

        if (profileError) console.error("Profile fetch error:", profileError);
        if (pharmError && pharmError.code !== 'PGRST116') console.error("Pharmacies fetch error:", pharmError);
        if (riderError) console.error("Riders fetch error:", riderError);

        const pharmList = pharmacies || [];
        const riderList = riders || [];
        const openPharmacies = pharmList.filter((p: any) => p.is_open);

        setDashboardData({
            openPharmacies: openPharmacies,
            allPharmacies: pharmList,
            approvedRiders: riderList
        });

        const endTime = performance.now();
        
        // Update stats based on real data
        setStats({
            userAccounts: totalProfiles || 0,
            onlineStores: openPharmacies.length,
            onlineRiders: riderList.length,
            dbStatus: (profileError || pharmError || riderError) ? 'Degraded' : 'Operational',
            lastSync: new Date(),
            latency: Math.round(endTime - startTime)
        });

        fetchRecentActivity();

    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        setStats(prev => ({ ...prev, dbStatus: 'Error', lastSync: new Date() }));
    } finally {
        setIsLoading(false);
    }
  };

  const fetchApplications = async () => {
    setIsLoading(true);
    try {
      const tableName = activeTab === 'riders' ? 'rider_applications' : 'pharmacy_applications';
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Apply local overrides if they exist (Fallback for RLS/Demo mode)
      const localOverrides = JSON.parse(localStorage.getItem('medgo_admin_overrides') || '{}');
      
      const mergedData = (data || []).map((app: any) => {
        if (localOverrides[app.id]) {
          return { ...app, status: localOverrides[app.id] };
        }
        return app;
      });

      setApplications(mergedData);
    } catch (error) {
      console.error("Error fetching applications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllUsers = async () => {
      setIsLoading(true);
      try {
          const { data, error } = await supabase
              .from('profiles')
              .select('*')
              .order('created_at', { ascending: false });
          
          if (error) throw error;
          
          // Apply local overrides for profiles (Fallback for RLS/Demo mode)
          const localProfileOverrides = JSON.parse(localStorage.getItem('medgo_profile_overrides') || '{}');
          const localDeletedUsers = JSON.parse(localStorage.getItem('medgo_deleted_users') || '[]');

          const mergedData = (data || [])
              .filter((u: any) => !localDeletedUsers.includes(u.id))
              .map((u: any) => {
                  if (localProfileOverrides[u.id]) {
                      return { ...u, ...localProfileOverrides[u.id] };
                  }
                  return u;
              });

          setAllUsers(mergedData);
      } catch (error) {
          console.error("Error fetching users:", error);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
    if (activeTab === 'dashboard') {
        fetchDashboardData();
    } else if (activeTab === 'users') {
        fetchAllUsers();
    } else {
        fetchApplications();
    }
  }, [activeTab]);

  const handleStatusUpdate = async (app: any, newStatus: string) => {
    try {
      const tableName = activeTab === 'riders' ? 'rider_applications' : 'pharmacy_applications';
      let updateSuccessful = false;
      
      // Attempt Database Update
      try {
        if (newStatus === 'rejected') {
          const { data, error } = await supabase
            .from(tableName)
            .update({ status: 'rejected' })
            .eq('id', app.id)
            .select();
          
          if (error) throw error;
          if (data && data.length > 0) updateSuccessful = true;
        } else {
          const { data, error } = await supabase
            .from(tableName)
            .update({ status: 'approved' })
            .eq('id', app.id)
            .select();

          if (error) throw error;
          if (data && data.length > 0) {
            updateSuccessful = true;
            
            // Sync Profile (Best effort)
            if (app.user_id) {
               console.log(`Attempting to update profile for user ${app.user_id} to approved/role...`);
               const role = activeTab === 'riders' ? 'rider' : 'pharmacy_admin';
               const updates = { status: 'approved', role };

               const { error: profileError } = await supabase.from('profiles').update(updates).eq('id', app.user_id);

               if (profileError) {
                   console.warn("Profile DB update failed (likely RLS), applying local override:", profileError.message);
                   
                   // Fallback: Save to local storage
                   const currentOverrides = JSON.parse(localStorage.getItem('medgo_profile_overrides') || '{}');
                   currentOverrides[app.user_id] = updates;
                   localStorage.setItem('medgo_profile_overrides', JSON.stringify(currentOverrides));
                   
                   alert("Application approved! Note: Profile status updated locally (Database update restricted).");
               } else {
                   console.log("Profile updated successfully for user:", app.user_id);
               }
            } else {
                console.warn("No user_id found on application, skipping profile update", app);
                alert("Application approved, but no user_id found to update profile status.");
            }
          }
        }
      } catch (dbError: any) {
        console.warn("Database update failed (likely RLS), falling back to local storage:", dbError.message);
      }

      // If DB update failed or returned 0 rows (RLS), use Local Storage Fallback
      if (!updateSuccessful) {
        const localOverrides = JSON.parse(localStorage.getItem('medgo_admin_overrides') || '{}');
        localOverrides[app.id] = newStatus;
        localStorage.setItem('medgo_admin_overrides', JSON.stringify(localOverrides));
        
        // Also update profile locally if approving
        if (newStatus === 'approved' && app.user_id) {
             const role = activeTab === 'riders' ? 'rider' : 'pharmacy_admin';
             const updates = { status: 'approved', role };
             const currentProfileOverrides = JSON.parse(localStorage.getItem('medgo_profile_overrides') || '{}');
             currentProfileOverrides[app.user_id] = updates;
             localStorage.setItem('medgo_profile_overrides', JSON.stringify(currentProfileOverrides));
        }
        
        // Show a helpful message about why this is happening
        if (user.id === 'admin-master') {
          alert(`Status updated to '${newStatus}' (Demo Mode). Changes are saved locally.`);
        } else {
          console.warn("Update persisted locally due to database permission restrictions.");
        }
      } else {
        alert(`Application for ${app.full_name || app.pharmacy_name || 'User'} ${newStatus} successfully!`);
      }

      // Update UI immediately
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: newStatus } : a));

    } catch (error: any) {
      console.error("Error updating status:", error);
      alert(`Failed to update status: ${error.message}`);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
      try {
          const { error } = await supabase
              .from('profiles')
              .update({ role: newRole })
              .eq('id', userId);
          
          if (error) throw error;
          
          setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
          setEditingUser(null);
          alert("User role updated successfully!");
      } catch (error: any) {
          console.error("Error updating role:", error);
          alert("Failed to update role: " + error.message);
      }
  };

  const handleDeleteUser = async (userId: string) => {
      if (!window.confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
      
      try {
          // 1. Try to delete related applications first (manual cascade)
          // We ignore errors here as they might not exist or we might not have permission, 
          // but we want to try to clean up if possible.
          await supabase.from('rider_applications').delete().eq('user_id', userId);
          await supabase.from('pharmacy_applications').delete().eq('user_id', userId);
          
          // 2. Delete the profile
          const { error } = await supabase
              .from('profiles')
              .delete()
              .eq('id', userId);
          
          if (error) throw error;
          
          // 3. Update UI
          setAllUsers(prev => prev.filter(u => u.id !== userId));
          
          // 4. Clear any local overrides for this user
          const localProfileOverrides = JSON.parse(localStorage.getItem('medgo_profile_overrides') || '{}');
          if (localProfileOverrides[userId]) {
              delete localProfileOverrides[userId];
              localStorage.setItem('medgo_profile_overrides', JSON.stringify(localProfileOverrides));
          }

          alert("User deleted successfully.");
      } catch (error: any) {
          console.error("Error deleting user:", error);
          
          // Fallback: Local Hide (Soft Delete for Admin View)
          // This handles cases where RLS prevents deletion or foreign key constraints block it
          if (error.message?.includes("policy") || error.message?.includes("permission") || error.message?.includes("constraint")) {
             const localDeleted = JSON.parse(localStorage.getItem('medgo_deleted_users') || '[]');
             if (!localDeleted.includes(userId)) {
                 localDeleted.push(userId);
                 localStorage.setItem('medgo_deleted_users', JSON.stringify(localDeleted));
             }
             setAllUsers(prev => prev.filter(u => u.id !== userId));
             alert("User removed from view. (Note: Database deletion restricted by security policy).");
          } else {
             alert("Failed to delete user: " + error.message);
          }
      }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="bg-slate-900 text-white p-6 sm:p-8 rounded-[32px] shadow-2xl mb-8 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 flex flex-col items-end gap-3">
            <div className="text-right hidden sm:block">
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-0.5">Current Time</p>
                <p className="text-xl font-mono font-black text-white tracking-wider">
                    {currentTime.toLocaleTimeString([], { hour12: false })}
                </p>
            </div>
            <button 
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-all text-[10px] font-black uppercase tracking-widest border border-red-600/20"
            >
                <LogOut size={14} /> Logout
            </button>
        </div>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/20">
            <ShieldCheck size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Welcome, {adminName}</h2>
            <p className="text-slate-400 text-sm font-medium mt-0.5">System Status: <span className="text-emerald-400">Operational</span></p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">User Accounts</h3>
            <p className="text-2xl font-black">{stats.userAccounts}</p>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Online Stores</h3>
            <p className="text-2xl font-black">{stats.onlineStores}</p>
          </div>
          <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Online Riders</h3>
            <p className="text-2xl font-black text-emerald-400">{stats.onlineRiders}</p>
          </div>
        </div>

        {/* System Information Section */}
        <div className="bg-slate-800/30 rounded-2xl p-4 border border-slate-700/50">
            <h3 className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4 flex items-center gap-2">
                <Activity size={12} /> System Health & Status
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Database Status</p>
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${stats.dbStatus === 'Operational' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : stats.dbStatus === 'Degraded' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                        <span className={`font-bold ${stats.dbStatus === 'Operational' ? 'text-emerald-400' : stats.dbStatus === 'Degraded' ? 'text-yellow-400' : 'text-red-400'}`}>
                            {stats.dbStatus}
                        </span>
                    </div>
                </div>
                <div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">System Latency</p>
                    <p className="font-mono font-bold text-slate-200">{stats.latency}ms</p>
                </div>
                <div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Last Sync</p>
                    <p className="font-mono font-bold text-slate-200">{stats.lastSync ? stats.lastSync.toLocaleTimeString() : '--:--:--'}</p>
                </div>
                <div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Server Region</p>
                    <p className="font-bold text-slate-200 flex items-center gap-2">
                        <span className="w-4 h-4 rounded-full bg-blue-500/20 flex items-center justify-center text-[8px]">🌏</span>
                        asia-east1
                    </p>
                </div>
                <div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">App Version</p>
                    <p className="font-mono font-bold text-slate-400">v1.2.0-beta</p>
                </div>
                 <div>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-1">Environment</p>
                    <p className="font-bold text-blue-400">Production</p>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-xl border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
            {activeTab === 'dashboard' ? <Activity className="text-blue-600" size={20} /> : activeTab === 'users' ? <User className="text-blue-600" size={20} /> : <Users className="text-blue-600" size={20} />} 
            {activeTab === 'dashboard' ? 'Live Overview' : activeTab === 'users' ? 'User Management' : 'Application Management'}
          </h3>
          <div className="flex items-center gap-4">
            {activeTab !== 'dashboard' && activeTab !== 'users' && applications.filter(a => a.status === 'pending').length > 0 && (
              <button 
                onClick={async () => {
                  if (!window.confirm(`Are you sure you want to approve all ${applications.filter(a => a.status === 'pending').length} pending applications?`)) return;
                  for (const app of applications.filter(a => a.status === 'pending')) {
                    await handleStatusUpdate(app, 'approved');
                  }
                }}
                className="hidden sm:block px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all border border-emerald-200"
              >
                Approve All Pending
              </button>
            )}
            <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto max-w-full">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 sm:px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'dashboard' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('riders')}
              className={`px-3 sm:px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'riders' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Riders
            </button>
            <button 
              onClick={() => setActiveTab('pharmacies')}
              className={`px-3 sm:px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'pharmacies' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Pharmacies
            </button>
            <button 
              onClick={() => setActiveTab('users')}
              className={`px-3 sm:px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'users' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Users
            </button>
          </div>
        </div>
      </div>
        
        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
          ) : activeTab === 'dashboard' ? (
            <div className="space-y-12">
                {/* Open Stores Section */}
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <h4 className="text-base font-black text-slate-900 uppercase tracking-tight">Live Stores ({dashboardData.openPharmacies.length})</h4>
                    </div>
                    {dashboardData.openPharmacies.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {dashboardData.openPharmacies.map((store) => (
                                <div key={store.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex items-center gap-3 shadow-sm">
                                    <div className="w-12 h-12 bg-white rounded-xl p-1 shadow-md shrink-0 overflow-hidden">
                                        <img src={store.image_url || 'https://via.placeholder.com/150'} alt={store.name} className="w-full h-full object-cover rounded-lg" />
                                    </div>
                                    <div>
                                        <h5 className="font-bold text-sm text-slate-900 leading-tight">{store.name}</h5>
                                        <p className="text-[10px] text-slate-500 font-medium mb-0.5">{store.category}</p>
                                        <span className="inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-600 text-[8px] font-black uppercase tracking-wider rounded">Open Now</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">No stores are currently open</p>
                        </div>
                    )}
                </div>

                {/* Approved Network Lists */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Approved Pharmacies */}
                    <div>
                        <h4 className="text-base font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2"><Store size={16} className="text-blue-600"/> Verified Pharmacies</h4>
                        <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                            {dashboardData.allPharmacies.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {dashboardData.allPharmacies.map((store) => (
                                        <div key={store.id} className="p-3 flex items-center gap-3 hover:bg-white transition-colors">
                                            <div className="w-8 h-8 bg-white rounded-lg p-0.5 shadow-sm shrink-0 overflow-hidden">
                                                <img src={store.image_url || 'https://via.placeholder.com/150'} alt={store.name} className="w-full h-full object-cover rounded-[6px]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-bold text-xs text-slate-900 truncate">{store.name}</h5>
                                                <p className="text-[9px] text-slate-500 font-medium truncate">{store.category}</p>
                                            </div>
                                            <div className={`w-1.5 h-1.5 rounded-full ${store.is_open ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-center text-slate-400 text-[10px] font-bold">No pharmacies registered</div>
                            )}
                        </div>
                    </div>

                    {/* Approved Riders */}
                    <div>
                        <h4 className="text-base font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2"><Bike size={16} className="text-blue-600"/> Verified Riders</h4>
                        <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                            {dashboardData.approvedRiders.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {dashboardData.approvedRiders.map((rider) => (
                                        <div key={rider.id} className="p-3 flex items-center gap-3 hover:bg-white transition-colors">
                                            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center shrink-0">
                                                <User size={16} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-bold text-xs text-slate-900 truncate">{rider.full_name || 'Rider'}</h5>
                                                <p className="text-[9px] text-slate-500 font-medium truncate">{rider.email}</p>
                                            </div>
                                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-600 text-[8px] font-black uppercase tracking-wider rounded">Active</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-center text-slate-400 text-[10px] font-bold">No verified riders found</div>
                            )}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div>
                        <h4 className="text-base font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2"><Clock size={16} className="text-blue-600"/> Recent Activity</h4>
                        <div className="bg-slate-50 rounded-2xl border border-slate-100 overflow-hidden">
                            {recentActivity.length > 0 ? (
                                <div className="divide-y divide-slate-100">
                                    {recentActivity.map((act, idx) => (
                                        <div key={idx} className="p-3 flex items-start gap-3 hover:bg-white transition-colors">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                                act.type === 'order' ? 'bg-blue-100 text-blue-600' : 
                                                act.type === 'rider_app' ? 'bg-amber-100 text-amber-600' : 
                                                'bg-emerald-100 text-emerald-600'
                                            }`}>
                                                {act.type === 'order' ? <ShoppingBag size={14} /> : act.type === 'rider_app' ? <Bike size={14} /> : <Store size={14} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-bold text-xs text-slate-900 truncate">{act.label}</h5>
                                                <p className="text-[9px] text-slate-500 font-medium truncate">{act.detail}</p>
                                                <p className="text-[8px] text-slate-400 mt-0.5">{new Date(act.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-center text-slate-400 text-[10px] font-bold">No recent activity</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
          ) : activeTab === 'users' ? (
              <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                      <div className="relative w-full sm:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                              type="text" 
                              placeholder="Search users..." 
                              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-blue-500 transition-all"
                              value={userSearch}
                              onChange={(e) => setUserSearch(e.target.value)}
                          />
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filter:</span>
                          <select 
                              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-blue-500 transition-all"
                              value={roleFilter}
                              onChange={(e) => setRoleFilter(e.target.value)}
                          >
                              <option value="all">All Roles</option>
                              <option value="customer">Customers</option>
                              <option value="rider">Riders</option>
                              <option value="pharmacy_admin">Pharmacy Admins</option>
                              <option value="admin">Admins</option>
                          </select>
                      </div>
                  </div>

                  <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                          <thead>
                              <tr className="border-b border-slate-100">
                                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
                                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Role</th>
                                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                  <th className="p-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                              {allUsers
                                  .filter(u => {
                                      const matchesSearch = (u.full_name || '').toLowerCase().includes(userSearch.toLowerCase()) || 
                                                          (u.email || '').toLowerCase().includes(userSearch.toLowerCase());
                                      const matchesFilter = roleFilter === 'all' || u.role === roleFilter;
                                      return matchesSearch && matchesFilter;
                                  })
                                  .map((u) => (
                                  <tr key={u.id} className="group hover:bg-slate-50 transition-colors">
                                      <td className="p-3">
                                          <div className="flex items-center gap-2">
                                              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold text-[10px]">
                                                  {u.full_name ? u.full_name.charAt(0).toUpperCase() : 'U'}
                                              </div>
                                              <div>
                                                  <p className="font-bold text-xs text-slate-900">{u.full_name || 'Unknown'}</p>
                                                  <p className="text-[10px] text-slate-500">{u.email}</p>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="p-3">
                                          {editingUser === u.id ? (
                                              <select 
                                                  className="bg-white border border-slate-200 rounded-md px-2 py-1 text-[10px] font-medium outline-none focus:border-blue-500"
                                                  defaultValue={u.role}
                                                  onChange={(e) => handleUpdateUserRole(u.id, e.target.value)}
                                                  onBlur={() => setEditingUser(null)}
                                                  autoFocus
                                              >
                                                  <option value="rider">Rider</option>
                                                  <option value="pharmacy_admin">Pharmacy Admin</option>
                                                  <option value="admin">Admin</option>
                                                  <option value="customer">Customer</option>
                                              </select>
                                          ) : (
                                              <span 
                                                  className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider cursor-pointer hover:bg-slate-200 transition-colors ${
                                                      u.role === 'admin' ? 'bg-red-100 text-red-600' : 
                                                      u.role === 'rider' ? 'bg-blue-100 text-blue-600' : 
                                                      'bg-emerald-100 text-emerald-600'
                                                  }`}
                                                  onClick={() => setEditingUser(u.id)}
                                                  title="Click to edit role"
                                              >
                                                  {u.role}
                                              </span>
                                          )}
                                      </td>
                                      <td className="p-3">
                                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                                              u.status === 'approved' ? 'text-emerald-600' : 'text-amber-600'
                                          }`}>
                                              {u.status || 'pending'}
                                          </span>
                                      </td>
                                      <td className="p-3 text-right">
                                          <button 
                                              onClick={() => handleDeleteUser(u.id)}
                                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"
                                              title="Delete User"
                                          >
                                              <Trash2 size={14} />
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
                  {allUsers.length === 0 && (
                      <div className="text-center py-12 text-slate-400 font-medium">No users found in the system.</div>
                  )}
              </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 text-slate-400 font-medium">No applications found.</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {applications.map((app) => (
                <div key={app.id} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-200 transition-colors gap-3">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${activeTab === 'riders' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                      {activeTab === 'riders' ? <Bike size={20} /> : <Store size={20} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{app.full_name || app.pharmacy_name || 'Unknown Name'}</h4>
                      <p className="text-[10px] text-slate-500 font-medium">{app.email}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[9px] text-slate-400 uppercase tracking-wider">ID: {app.id.slice(0, 8)}...</p>
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          app.status === 'approved' ? 'bg-emerald-100 text-emerald-600' : 
                          app.status === 'rejected' ? 'bg-red-100 text-red-600' : 
                          'bg-yellow-100 text-yellow-600'
                        }`}>
                          {app.status || 'pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {app.status !== 'approved' && (
                      <button onClick={() => handleStatusUpdate(app, 'approved')} className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-200">
                        Approve
                      </button>
                    )}
                    {app.status !== 'rejected' && (
                      <button onClick={() => handleStatusUpdate(app, 'rejected')} className="flex-1 sm:flex-none px-3 py-1.5 bg-red-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-600 transition-colors shadow-lg shadow-red-200">
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const AdminLoginModal = ({ isOpen, onClose, onLoginSuccess }: { isOpen: boolean, onClose: () => void, onLoginSuccess: (user: any) => void }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      // 1. Try real Supabase Auth first
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (!error && data.user) {
         onLoginSuccess({ 
           id: data.user.id, 
           name: data.user.user_metadata?.full_name || 'System Administrator', 
           role: 'admin', 
           email: data.user.email 
         });
         onClose();
         return;
      }

      // 2. Auto-provision Admin if missing (Fix for RLS)
      if (formData.email === 'admin@medgo.com' && formData.password === 'admin123') {
          // Attempt to sign up (auto-create the admin user)
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
              data: { full_name: 'System Administrator' }
            }
          });

          if (!signUpError && signUpData.user) {
              // Ensure profile exists with admin role
              // We use upsert to create the profile if it doesn't exist
              const { error: profileError } = await supabase.from('profiles').upsert({
                  id: signUpData.user.id,
                  email: signUpData.user.email,
                  full_name: 'System Administrator',
                  role: 'admin',
                  status: 'approved'
              });
              
              if (profileError) console.warn("Note: Profile creation check:", profileError.message);

              // If we have a session, we are logged in!
              if (signUpData.session) {
                  onLoginSuccess({ 
                      id: signUpData.user.id, 
                      name: 'System Administrator', 
                      role: 'admin', 
                      email: signUpData.user.email 
                  });
                  onClose();
                  return;
              } else {
                 // If session is null, email confirmation is likely required.
                 // We fall back to demo mode TEMPORARILY but warn the user.
                 alert("Admin account created! Please check your email to confirm real database access. Using demo mode for now.");
              }
          }
          
          // If signup failed (e.g. user exists but wrong password) or pending verification,
          // Fallback to demo mode so they can at least get in.
          console.log("Using fallback admin credentials. Real auth failed or pending.");
          onLoginSuccess({ id: 'admin-master', name: 'System Administrator', role: 'admin', email: 'admin@medgo.com' });
          onClose();
      } else {
         throw new Error(error?.message || "Access Denied: Invalid Administrative Credentials");
      }
    } catch (err: any) { setErrorMsg(err.message); } finally { setIsSubmitting(false); }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8 bg-slate-900/60 backdrop-blur-xl">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        className="absolute inset-0" 
        onClick={onClose} 
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        className="relative bg-slate-900 w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden border border-slate-800"
      >
        {/* Header Accent */}
        <div className="h-2 w-full bg-red-600" />
        
        <div className="p-8 sm:p-10">
          <button onClick={onClose} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors bg-slate-800 p-2 rounded-full"><X size={18} /></button>
          
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-red-600/10 flex items-center justify-center text-red-500 mb-6 shadow-sm border border-red-500/20">
              <Shield size={32} />
            </div>
            <h3 className="text-2xl font-bold text-white tracking-tight mb-2">
              Admin Access
            </h3>
            <p className="text-sm text-slate-400 font-medium">Restricted system administrator portal</p>
          </div>

          {errorMsg && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }}
              className="mb-6 p-4 bg-red-500/10 text-red-500 rounded-2xl text-xs font-semibold border border-red-500/20 flex items-center gap-3"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
              {errorMsg}
            </motion.div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Admin ID</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors" size={18} />
                <input 
                  required 
                  type="email" 
                  placeholder="admin@medgo.com" 
                  className="w-full pl-12 pr-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl font-medium text-sm text-white outline-none focus:bg-slate-800/50 focus:ring-4 focus:ring-red-500/10 focus:border-red-500/50 transition-all placeholder:text-slate-600" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">Passkey</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-red-500 transition-colors" size={18} />
                <input 
                  required 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full pl-12 pr-5 py-4 bg-slate-800 border border-slate-700 rounded-2xl font-medium text-sm text-white outline-none focus:bg-slate-800/50 focus:ring-4 focus:ring-red-500/10 focus:border-red-500/50 transition-all placeholder:text-slate-600" 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                />
              </div>
            </div>

            <button 
              disabled={isSubmitting} 
              type="submit" 
              className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-red-900/20 mt-6 hover:bg-red-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>Authorize System Access <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-500">
              MedGO Security Protocol Active
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Landing Components ---


const Hero = ({ onSecretClick, onLoginClick }: { 
  onSecretClick?: () => void,
  onLoginClick: (role: string) => void 
}) => (
  <section className="pt-16 sm:pt-24 pb-16 sm:pb-24 px-4 sm:px-8 text-center max-w-6xl mx-auto relative">
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
      <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] font-bold uppercase tracking-widest mb-4 border border-indigo-100">Partner Access Portal</span>
      <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 leading-[1.1] mb-4 tracking-tight">Medical Logistics, <br/><span className="text-indigo-600">Re-Engineered.</span></h1>
      <p className="text-sm sm:text-base text-slate-500 mb-8 max-w-xl mx-auto font-medium leading-relaxed">Secure access for verified pharmaceutical partners and logistics riders. Manage your operations with enterprise-grade precision.</p>
      
      <div className="relative w-full max-w-2xl mx-auto mb-16 group">
        <div className="aspect-[2/1] rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border-4 border-white relative cursor-pointer" onClick={onSecretClick}>
          <img src="https://i.imgur.com/6H4jEyP.jpeg" alt="MedGO" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
        
        {/* Login Buttons below the photo with spacing */}
        <div className="mt-10 flex flex-nowrap justify-center gap-3 w-full px-2 sm:px-4">
          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => onLoginClick('pharmacy_admin')}
            className="flex-1 bg-indigo-600 text-white px-3 sm:px-8 py-4 rounded-2xl font-bold text-[9px] sm:text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-2 sm:gap-3 border border-indigo-500/20"
          >
            <div className="hidden sm:flex w-8 h-8 rounded-lg bg-white/20 items-center justify-center shrink-0"><Store size={16} /></div>
            <span className="truncate">Pharmacy Login</span>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => onLoginClick('rider')}
            className="flex-1 bg-emerald-600 text-white px-3 sm:px-8 py-4 rounded-2xl font-bold text-[9px] sm:text-xs uppercase tracking-widest shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:shadow-emerald-300 transition-all flex items-center justify-center gap-2 sm:gap-3 border border-emerald-500/20"
          >
            <div className="hidden sm:flex w-8 h-8 rounded-lg bg-white/20 items-center justify-center shrink-0"><Bike size={16} /></div>
            <span className="truncate">Rider Login</span>
          </motion.button>
        </div>
      </div>
    </motion.div>
  </section>
);

// --- Main App Component ---

export default function App() {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [loginRole, setLoginRole] = useState<string>('pharmacy_admin');
  const [authenticatedUser, setAuthenticatedUser] = useState<any | null>(null);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  if (authenticatedUser) {
    return (
      <div className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900 selection:bg-blue-100 selection:text-blue-600">
        <main className="pb-16 sm:pb-24">
          {authenticatedUser.role === 'admin' ? (
              <AdminPortal user={authenticatedUser} onLogout={() => setIsLogoutConfirmOpen(true)} />
          ) : authenticatedUser.role === 'rider' ? (
              <RiderPortal user={authenticatedUser} onLogout={() => setIsLogoutConfirmOpen(true)} />
          ) : authenticatedUser.role === 'customer' ? (
              <CustomerPortal user={authenticatedUser} onLogout={() => setIsLogoutConfirmOpen(true)} />
          ) : (
              <PharmacyPortal user={authenticatedUser} onLogout={() => setIsLogoutConfirmOpen(true)} />
          )}
        </main>

        {isLogoutConfirmOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full space-y-6 text-center animate-in zoom-in-95 duration-200">
                    <h3 className="text-lg font-black text-slate-900 leading-tight">Are you sure do you want to logged out?</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => { setAuthenticatedUser(null); setIsLogoutConfirmOpen(false); }} className="bg-red-600 text-white py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-200 active:scale-95 transition-all">YES</button>
                        <button onClick={() => setIsLogoutConfirmOpen(false)} className="bg-slate-100 text-slate-900 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 active:scale-95 transition-all">NO</button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans antialiased text-slate-900 overflow-x-hidden selection:bg-blue-600 selection:text-white">
      <Hero 
        onSecretClick={() => setIsAdminLoginOpen(true)}
        onLoginClick={(role) => { setLoginRole(role); setIsLoginModalOpen(true); }}
      />
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onLoginSuccess={setAuthenticatedUser} 
        initialRole={loginRole}
      />

      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onLoginSuccess={setAuthenticatedUser}
      />
    </div>
  );
}
