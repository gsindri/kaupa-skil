import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Building2, MapPin, Clock, Package, Mail, Phone, Globe } from 'lucide-react'
import type { EnhancedSupplier } from '@/hooks/useSupplierSearch'

interface SupplierDiscoveryCardProps {
  supplier: EnhancedSupplier
  onRequestAccess?: (supplier: EnhancedSupplier) => void
  onViewDetails?: (supplier: EnhancedSupplier) => void
}

export function SupplierDiscoveryCard({
  supplier,
  onRequestAccess,
  onViewDetails,
}: SupplierDiscoveryCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('is-IS', {
      style: 'currency',
      currency: 'ISK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card className="hover:shadow-md transition-shadow h-full flex flex-col">
      <CardHeader>
        <div className="flex items-start gap-3">
          {supplier.logo_url ? (
            <img
              src={supplier.logo_url}
              alt={supplier.display_name}
              className="h-12 w-12 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">
              {supplier.display_name}
            </CardTitle>
            <div className="flex flex-wrap gap-1 mt-2">
              {supplier.is_featured && (
                <Badge variant="default" className="text-xs">
                  Featured
                </Badge>
              )}
              {supplier.badges?.map((badge) => (
                <Badge key={badge} variant="outline" className="text-xs">
                  {badge}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        {supplier.short_description && (
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
            {supplier.short_description}
          </p>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Categories */}
        {supplier.categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {supplier.categories.map((category) => (
              <Badge key={category.id} variant="secondary" className="text-xs">
                {category.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Supplier Details */}
        <div className="space-y-2 text-sm">
          {supplier.coverage_areas && supplier.coverage_areas.length > 0 && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{supplier.coverage_areas.join(', ')}</span>
            </div>
          )}
          {supplier.avg_lead_time_days !== null && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>~{supplier.avg_lead_time_days} days lead time</span>
            </div>
          )}
          {supplier.min_order_isk !== null && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>Min. order: {formatCurrency(supplier.min_order_isk)}</span>
            </div>
          )}
        </div>

        {/* Contact Information */}
        <div className="space-y-1 text-xs text-muted-foreground">
          {supplier.contact_email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3" />
              <span className="truncate">{supplier.contact_email}</span>
            </div>
          )}
          {supplier.contact_phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3 w-3" />
              <span>{supplier.contact_phone}</span>
            </div>
          )}
          {supplier.website && (
            <div className="flex items-center gap-2">
              <Globe className="h-3 w-3" />
              <a
                href={supplier.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline truncate"
                onClick={(e) => e.stopPropagation()}
              >
                {supplier.website.replace(/^https?:\/\//, '')}
              </a>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-4">
          {onViewDetails && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onViewDetails(supplier)}
            >
              View Details
            </Button>
          )}
          {onRequestAccess && (
            <Button
              className="flex-1"
              onClick={() => onRequestAccess(supplier)}
            >
              Request Access
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
