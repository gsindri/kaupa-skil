import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, ChefHat, Package, ArrowRight, ShoppingCart, Apple, Wheat } from 'lucide-react';

// Updated with real Icelandic suppliers and relevant categories/colors
const CONNECTIONS = [
    {
        id: 'sup-1',
        label: 'Bananar',
        category: 'Fruits & Veg',
        color: 'bg-green-500',
        bgSoft: 'bg-green-50',
        text: 'text-green-600',
        line: '#22c55e',
        icon: Apple
    },
    {
        id: 'sup-2',
        label: 'Innnes',
        category: 'Full Line',
        color: 'bg-blue-500',
        bgSoft: 'bg-blue-50',
        text: 'text-blue-600',
        line: '#3b82f6',
        icon: Truck
    },
    {
        id: 'sup-3',
        label: 'Garri',
        category: 'Bakery & Dry',
        color: 'bg-amber-500',
        bgSoft: 'bg-amber-50',
        text: 'text-amber-600',
        line: '#f59e0b',
        icon: Wheat
    },
];

export const OrderingFlowDiagram: React.FC = () => {
    const [activeSuppliers, setActiveSuppliers] = useState<string[]>([]);
    const hasOrders = activeSuppliers.length > 0;

    const toggleSupplier = (id: string) => {
        setActiveSuppliers(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    return (
        <div className="relative w-full max-w-4xl mx-auto p-4 md:p-8 my-12">

            {/* Background Atmosphere */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-stone-100/50 rounded-full blur-3xl -z-10" />
            <div className="absolute top-1/2 right-0 w-64 h-64 bg-blue-100/30 rounded-full blur-3xl -z-10" />

            {/* Main Glass Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8 md:p-12 overflow-hidden relative">

                {/* Header */}
                <div className="text-center mb-12">
                    <h3 className="font-serif text-3xl md:text-4xl mb-3 text-stone-900">One Shared Catalog</h3>
                    <p className="text-stone-500">
                        Click the <span className="font-bold text-stone-800">Suppliers</span> to unify your ordering guide.
                    </p>
                </div>

                {/* Diagram Area - Wider and spaced out */}
                <div className="relative flex justify-between items-center h-[340px]">

                    {/* --- LEFT COLUMN: SUPPLIERS --- */}
                    {/* Changed from justify-between to justify-center + gap to bring them closer */}
                    <div className="flex flex-col justify-center gap-5 z-10 w-56">
                        {CONNECTIONS.map((supplier) => {
                            const isActive = activeSuppliers.includes(supplier.id);
                            const Icon = supplier.icon;
                            return (
                                <motion.button
                                    key={supplier.id}
                                    onClick={() => toggleSupplier(supplier.id)}
                                    whileHover={{ scale: 1.02, x: 5 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`group flex items-center gap-4 p-3.5 rounded-xl border-2 transition-all duration-300 text-left
                    ${isActive
                                            ? 'bg-white border-stone-800 shadow-lg z-20'
                                            : 'bg-white/50 border-stone-200 hover:border-stone-300 hover:bg-white z-10'
                                        }`}
                                >
                                    {/* Icon */}
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300 shrink-0
                    ${isActive ? `${supplier.color} text-white` : `${supplier.bgSoft} ${supplier.text}`}`}>
                                        <Icon size={18} />
                                    </div>

                                    <div>
                                        <div className={`text-base font-bold leading-tight ${isActive ? 'text-stone-900' : 'text-stone-600'}`}>
                                            {supplier.label}
                                        </div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-0.5">
                                            {supplier.category}
                                        </div>
                                    </div>

                                    {/* Small checkmark for active state */}
                                    {isActive && (
                                        <motion.div
                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            className="ml-auto text-stone-900"
                                        >
                                            <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                        </motion.div>
                                    )}
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* --- CENTER: SVG LINES --- */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {CONNECTIONS.map((supplier, index) => {
                                const isActive = activeSuppliers.includes(supplier.id);
                                // New Y coordinates to match the tighter grouping (approx 32%, 50%, 68%)
                                const yPos = index === 0 ? 32 : index === 1 ? 50 : 68;

                                return (
                                    <g key={`line-${supplier.id}`}>
                                        {/* Base Path */}
                                        <path
                                            d={`M 26,${yPos} L 62,50`}
                                            fill="none"
                                            stroke="#E5E7EB"
                                            strokeWidth="0.5"
                                            vectorEffect="non-scaling-stroke"
                                        />

                                        {/* Active Path */}
                                        {isActive && (
                                            <motion.path
                                                d={`M 26,${yPos} L 62,50`}
                                                fill="none"
                                                stroke={supplier.line}
                                                strokeWidth="1.5"
                                                initial={{ pathLength: 0, opacity: 0 }}
                                                animate={{ pathLength: 1, opacity: 1 }}
                                                transition={{ duration: 0.6, ease: "easeInOut" }}
                                                vectorEffect="non-scaling-stroke"
                                            />
                                        )}

                                        {/* Traveling Particle */}
                                        {isActive && (
                                            <circle r="1" fill={supplier.line}>
                                                <animateMotion
                                                    dur="1.5s"
                                                    repeatCount="indefinite"
                                                    path={`M 26,${yPos} L 62,50`}
                                                    keyPoints="0;1"
                                                    keyTimes="0;1"
                                                    calcMode="linear"
                                                />
                                            </circle>
                                        )}
                                    </g>
                                );
                            })}
                        </svg>
                    </div>

                    {/* --- RIGHT COLUMN: REALISTIC MINI APP UI --- */}
                    <div className="z-10 flex flex-col justify-center items-end">
                        <div className={`relative w-[320px] aspect-[4/3] bg-stone-50 rounded-xl border-2 transition-all duration-500 overflow-hidden flex flex-col
              ${hasOrders ? 'border-stone-800 shadow-2xl scale-105' : 'border-stone-200 shadow-lg'}`}>

                            {/* Window Header */}
                            <div className="h-8 bg-white border-b border-stone-100 flex items-center px-3 gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-stone-200" />
                                <div className="w-2 h-2 rounded-full bg-stone-200" />
                                <div className="w-2 h-2 rounded-full bg-stone-200" />
                            </div>

                            {/* App Content */}
                            <div className="flex-1 flex p-3 gap-3 overflow-hidden">
                                {/* Left: Cart Items */}
                                <div className="flex-1 flex flex-col gap-2">
                                    <div className="h-2 w-16 bg-stone-200 rounded-full mb-1" /> {/* "Cart" title */}
                                    <AnimatePresence>
                                        {activeSuppliers.map((id) => {
                                            const s = CONNECTIONS.find(c => c.id === id);
                                            return (
                                                <motion.div
                                                    key={id}
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                                                    className="h-10 bg-white rounded border border-stone-100 flex items-center px-2 gap-2 shadow-sm"
                                                >
                                                    <div className={`w-6 h-6 rounded ${s?.bgSoft} flex items-center justify-center`}>
                                                        {s && <s.icon size={12} className={s.text} />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="h-1.5 w-12 bg-stone-200 rounded-full mb-1" />
                                                        <div className="h-1 w-8 bg-stone-100 rounded-full" />
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                    {activeSuppliers.length === 0 && (
                                        <div className="h-full flex items-center justify-center text-stone-300 text-[10px]">
                                            Your cart is empty
                                        </div>
                                    )}
                                </div>

                                {/* Right: Summary Sidebar */}
                                <div className="w-24 bg-white rounded border border-stone-100 p-2 flex flex-col gap-2 shadow-sm">
                                    <div className="h-1.5 w-10 bg-stone-200 rounded-full" /> {/* "Summary" */}
                                    <div className="space-y-1 mt-1">
                                        <div className="flex justify-between"><div className="h-1 w-6 bg-stone-100 rounded-full" /><div className="h-1 w-4 bg-stone-100 rounded-full" /></div>
                                        <div className="flex justify-between"><div className="h-1 w-5 bg-stone-100 rounded-full" /><div className="h-1 w-4 bg-stone-100 rounded-full" /></div>
                                    </div>
                                    <div className="mt-auto h-6 bg-stone-900 rounded flex items-center justify-center text-white text-[8px] font-bold">
                                        Checkout
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Action Hint */}
                <div className={`mt-10 text-center transition-all duration-500 ${hasOrders ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>
                    <p className="text-xs text-stone-400 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                        <ArrowRight size={14} className="text-stone-300 animate-bounce-x" /> Select suppliers to begin
                    </p>
                </div>

            </div>
        </div>
    );
};
