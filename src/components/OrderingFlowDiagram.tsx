import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, ChefHat, Check, ShoppingBag, ArrowRight, Package } from 'lucide-react';

const CONNECTIONS = [
    { id: 'sup-1', label: 'Produce Pro', category: 'Vegetables', color: 'bg-green-500', bgSoft: 'bg-green-50', text: 'text-green-600', line: '#22c55e' },
    { id: 'sup-2', label: 'Prime Meats', category: 'Proteins', color: 'bg-red-500', bgSoft: 'bg-red-50', text: 'text-red-600', line: '#ef4444' },
    { id: 'sup-3', label: 'BevDistro', category: 'Beverages', color: 'bg-blue-500', bgSoft: 'bg-blue-50', text: 'text-blue-600', line: '#3b82f6' },
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
        <div className="relative w-full max-w-3xl mx-auto p-8 my-12">

            {/* 1. ATMOSPHERE: Warm Glow Behind (Fixes the 'Grey' feeling) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-stone-100/50 rounded-full blur-3xl -z-10" />
            <div className="absolute top-1/2 right-0 w-64 h-64 bg-orange-100/40 rounded-full blur-3xl -z-10" />

            {/* Main Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8 overflow-hidden relative">

                {/* Header */}
                <div className="text-center mb-10">
                    <h3 className="font-serif text-3xl mb-3 text-stone-900">One Shared Catalog</h3>
                    <p className="text-stone-500 text-sm md:text-base">
                        Click the <span className="font-bold text-stone-800">Suppliers</span> to unify your ordering guide.
                    </p>
                </div>

                {/* Diagram Area */}
                <div className="relative flex justify-between h-[340px]">

                    {/* --- LEFT COLUMN: SUPPLIERS --- */}
                    {/* justify-between ensures they sit exactly at Top, Middle, Bottom matching SVG coords */}
                    <div className="flex flex-col justify-between z-10 w-48">
                        {CONNECTIONS.map((supplier) => {
                            const isActive = activeSuppliers.includes(supplier.id);
                            return (
                                <motion.button
                                    key={supplier.id}
                                    onClick={() => toggleSupplier(supplier.id)}
                                    whileHover={{ scale: 1.02, x: 5 }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`group flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-300 text-left
                    ${isActive
                                            ? 'bg-white border-stone-800 shadow-lg'
                                            : 'bg-white/50 border-stone-200 hover:border-stone-300 hover:bg-white'
                                        }`}
                                >
                                    {/* Icon: Always colored now, just softer when inactive */}
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors duration-300 
                    ${isActive ? `${supplier.color} text-white` : `${supplier.bgSoft} ${supplier.text}`}`}>
                                        <Truck size={18} />
                                    </div>

                                    <div>
                                        <div className={`text-sm font-bold leading-tight ${isActive ? 'text-stone-900' : 'text-stone-600'}`}>
                                            {supplier.label}
                                        </div>
                                        <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 mt-0.5">
                                            {supplier.category}
                                        </div>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </div>

                    {/* --- CENTER: SVG LINES --- */}
                    {/* inset-0 with w-full allows it to bridge the gap perfectly */}
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            {CONNECTIONS.map((supplier, index) => {
                                const isActive = activeSuppliers.includes(supplier.id);
                                // Coordinates: Starts at 35% (right side of left col) ends at 65% (left side of right col)
                                // Y-Coords: 12% (Top), 50% (Mid), 88% (Bot) - tuned to match justify-between
                                const yPos = index === 0 ? 12 : index === 1 ? 50 : 88;

                                return (
                                    <g key={`line-${supplier.id}`}>
                                        {/* Base Path (The "Road") - visible but faint by default */}
                                        <path
                                            d={`M 30,${yPos} C 50,${yPos} 50,50 70,50`}
                                            fill="none"
                                            stroke="#E5E7EB"
                                            strokeWidth="0.5"
                                            vectorEffect="non-scaling-stroke"
                                        />

                                        {/* Active Path (The "Signal") */}
                                        {isActive && (
                                            <motion.path
                                                d={`M 30,${yPos} C 50,${yPos} 50,50 70,50`}
                                                fill="none"
                                                stroke={supplier.line}
                                                strokeWidth="1"
                                                initial={{ pathLength: 0, opacity: 0 }}
                                                animate={{ pathLength: 1, opacity: 1 }}
                                                transition={{ duration: 0.4 }}
                                                vectorEffect="non-scaling-stroke"
                                            />
                                        )}
                                    </g>
                                );
                            })}
                        </svg>
                    </div>

                    {/* --- RIGHT COLUMN: RESTAURANT --- */}
                    <div className="z-10 flex flex-col justify-center w-48 items-end">
                        <div className={`relative w-full aspect-square bg-white rounded-2xl border-2 transition-all duration-500 flex flex-col items-center justify-center gap-2
              ${hasOrders ? 'border-stone-800 shadow-xl scale-105' : 'border-stone-100 shadow-sm'}`}>

                            {/* Floating Badge */}
                            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-md whitespace-nowrap">
                                Your Restaurant
                            </div>

                            <ChefHat size={32} className={`transition-colors duration-300 ${hasOrders ? 'text-stone-900' : 'text-stone-300'}`} />

                            <div className="text-center">
                                <div className="font-serif font-bold text-lg text-stone-900">Weekly Order</div>
                                <div className="text-xs text-stone-400 mt-1 font-medium">
                                    {hasOrders ? (
                                        <span className="text-green-600 flex items-center justify-center gap-1">
                                            <Package size={12} /> {activeSuppliers.length} Suppliers Linked
                                        </span>
                                    ) : (
                                        "Waiting for input..."
                                    )}
                                </div>
                            </div>

                            {/* Incoming Dots Indicator */}
                            <div className="absolute bottom-4 flex gap-1 h-2">
                                <AnimatePresence>
                                    {activeSuppliers.map((id) => {
                                        const sup = CONNECTIONS.find(s => s.id === id);
                                        return (
                                            <motion.div
                                                key={id}
                                                initial={{ scale: 0, y: 10 }}
                                                animate={{ scale: 1, y: 0 }}
                                                exit={{ scale: 0 }}
                                                className={`w-2 h-2 rounded-full ${sup?.color}`}
                                            />
                                        )
                                    })}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Hint */}
                <div className={`mt-8 text-center transition-opacity duration-500 ${hasOrders ? 'opacity-0' : 'opacity-100'}`}>
                    <p className="text-xs text-stone-400 font-medium uppercase tracking-widest flex items-center justify-center gap-2">
                        <ArrowRight size={12} className="animate-pulse" /> Select a supplier to connect
                    </p>
                </div>

            </div>
        </div>
    );
};
