import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Truck, ChefHat, Check, ShoppingBag, ArrowRight } from 'lucide-react';

// 1. DATA STRUCTURE (Adapted from "Adjacency" in SurfaceCodeDiagram)
// Instead of Qubit->Stabilizer, we map Supplier->Catalog Category
const CONNECTIONS = [
    { id: 'sup-1', label: 'Produce Pro', category: 'Vegetables', color: 'bg-green-500', line: '#22c55e' },
    { id: 'sup-2', label: 'Prime Meats', category: 'Proteins', color: 'bg-red-500', line: '#ef4444' },
    { id: 'sup-3', label: 'BevDistro', category: 'Beverages', color: 'bg-blue-500', line: '#3b82f6' },
];

export const OrderingFlowDiagram: React.FC = () => {
    // 2. STATE (Adapted from "errors" state in SurfaceCodeDiagram)
    // Tracks which suppliers are currently "selected" or sending data
    const [activeSuppliers, setActiveSuppliers] = useState<string[]>([]);

    const toggleSupplier = (id: string) => {
        setActiveSuppliers(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    // Logic to check if the "Restaurant" (Right side) has received any order
    const hasOrders = activeSuppliers.length > 0;

    return (
        <div className="w-full max-w-4xl mx-auto p-8 bg-white rounded-2xl shadow-xl border border-stone-100 my-12 overflow-hidden">

            {/* Header */}
            <div className="text-center mb-10">
                <h3 className="font-serif text-3xl mb-3 text-stone-900">One Shared Catalog</h3>
                <p className="text-stone-500">
                    Click the <span className="font-bold text-stone-800">Suppliers</span> on the left to add them to your unified order guide.
                </p>
            </div>

            <div className="relative flex justify-between items-center h-80 px-4 md:px-12 bg-stone-50/50 rounded-xl border border-stone-200/60">

                {/* BACKGROUND GRID (From SurfaceCodeDiagram styling) */}
                <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
                </div>

                {/* --- LEFT COLUMN: SUPPLIERS --- */}
                <div className="flex flex-col gap-6 z-10">
                    {CONNECTIONS.map((supplier) => {
                        const isActive = activeSuppliers.includes(supplier.id);

                        return (
                            <motion.button
                                key={supplier.id}
                                onClick={() => toggleSupplier(supplier.id)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={`relative group flex items-center gap-4 p-3 pr-6 rounded-full border-2 transition-all duration-300 bg-white
                  ${isActive
                                        ? 'border-stone-800 shadow-md translate-x-2'
                                        : 'border-stone-200 hover:border-stone-400 opacity-70 hover:opacity-100'
                                    }`}
                            >
                                {/* Icon Circle */}
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white transition-colors duration-300 ${isActive ? supplier.color : 'bg-stone-300'}`}>
                                    <Truck size={18} />
                                </div>

                                <div className="text-left">
                                    <div className={`text-sm font-bold ${isActive ? 'text-stone-900' : 'text-stone-400'}`}>
                                        {supplier.label}
                                    </div>
                                    <div className="text-[10px] uppercase tracking-wider text-stone-400">
                                        {supplier.category}
                                    </div>
                                </div>

                                {/* Active Indicator Dot (Like the active Stabilizers) */}
                                {isActive && (
                                    <motion.div
                                        layoutId="active-glow"
                                        className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-stone-800 rounded-full"
                                    />
                                )}
                            </motion.button>
                        );
                    })}
                </div>

                {/* --- CENTER: THE ANIMATED "SIGNAL" LINES --- */}
                {/* We use an SVG overlay to draw lines from Left Nodes to Right Node */}
                <div className="absolute inset-0 pointer-events-none">
                    <svg className="w-full h-full">
                        {CONNECTIONS.map((supplier, index) => {
                            const isActive = activeSuppliers.includes(supplier.id);
                            // Calculate rough Y positions based on index (0, 1, 2)
                            // const startY = 15 + (index * 35) + '%'; 

                            return (
                                <g key={`line-${supplier.id}`}>
                                    {/* Base Line (Grey) */}
                                    <path
                                        d={`M 250,${(index * 100) + 60} C 400,${(index * 100) + 60} 400,160 650,160`}
                                        fill="none"
                                        stroke="#E5E7EB"
                                        strokeWidth="2"
                                        vectorEffect="non-scaling-stroke"
                                        // Note: In a real app, you'd calculate exact coordinates via refs. 
                                        // Here we use simplified relative logic for the demo.
                                        className="hidden md:block" // Hide on mobile for simplicity
                                        style={{ transformOrigin: 'center' }}
                                    />

                                    {/* Active Signal Line (Animated) */}
                                    {isActive && (
                                        <motion.path
                                            d={`M 280,${(index * 90) + 65} C 450,${(index * 90) + 65} 450,160 600,160`}
                                            fill="none"
                                            stroke={supplier.line}
                                            strokeWidth="3"
                                            strokeDasharray="10 5"
                                            initial={{ pathLength: 0, opacity: 0 }}
                                            animate={{ pathLength: 1, opacity: 1 }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                            className="hidden md:block"
                                        />
                                    )}

                                    {/* Moving Particle (The "Order" traveling) */}
                                    {isActive && (
                                        <motion.circle r="4" fill={supplier.line} className="hidden md:block">
                                            <animateMotion
                                                dur="1s"
                                                repeatCount="indefinite"
                                                path={`M 280,${(index * 90) + 65} C 450,${(index * 90) + 65} 450,160 600,160`}
                                            />
                                        </motion.circle>
                                    )}
                                </g>
                            );
                        })}
                    </svg>
                </div>

                {/* --- RIGHT COLUMN: THE RESTAURANT (The Stabilizer) --- */}
                <div className="z-10 flex flex-col items-center">

                    {/* The "Deilda" Master Node */}
                    <motion.div
                        animate={{
                            scale: hasOrders ? 1.05 : 1,
                            borderColor: hasOrders ? '#000' : '#E5E7EB',
                            boxShadow: hasOrders ? '0px 10px 30px rgba(0,0,0,0.1)' : 'none'
                        }}
                        className="w-48 h-48 bg-white rounded-xl border-2 flex flex-col items-center justify-center relative transition-colors duration-500"
                    >
                        <div className="absolute -top-3 bg-stone-900 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-widest">
                            Your Restaurant
                        </div>

                        <ChefHat size={32} className={`mb-3 transition-colors ${hasOrders ? 'text-stone-900' : 'text-stone-300'}`} />

                        <div className="text-center px-4">
                            <div className="font-serif font-bold text-lg text-stone-900 mb-1">Weekly Order</div>

                            {/* Dynamic Counter */}
                            <div className="text-xs text-stone-500 font-mono flex items-center justify-center gap-2">
                                <span>{activeSuppliers.length} Suppliers</span>
                                <ArrowRight size={10} />
                                <span className={`${hasOrders ? 'text-green-600 font-bold' : ''}`}>1 Catalog</span>
                            </div>
                        </div>

                        {/* List of received items (The "Stabilizer" Logic detecting inputs) */}
                        <div className="absolute -bottom-12 w-full flex justify-center gap-1">
                            <AnimatePresence>
                                {activeSuppliers.map((id, i) => {
                                    const sup = CONNECTIONS.find(s => s.id === id);
                                    return (
                                        <motion.div
                                            key={id}
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0 }}
                                            transition={{ delay: i * 0.1 }}
                                            className={`w-2 h-2 rounded-full ${sup?.color}`}
                                        />
                                    )
                                })}
                            </AnimatePresence>
                        </div>

                    </motion.div>
                </div>

            </div>

            {/* --- BOTTOM SUMMARY (Like PerformanceMetricDiagram) --- */}
            <div className="mt-8 flex justify-center">
                <div className={`flex items-center gap-3 px-6 py-3 rounded-full transition-all duration-500 ${hasOrders ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-400'}`}>
                    {hasOrders ? <Check size={18} className="text-green-400" /> : <ShoppingBag size={18} />}
                    <span className="font-medium text-sm">
                        {hasOrders
                            ? `Consolidated ${activeSuppliers.length} supplier orders into one click.`
                            : "Select suppliers to start building your catalog."}
                    </span>
                </div>
            </div>

        </div>
    );
};
