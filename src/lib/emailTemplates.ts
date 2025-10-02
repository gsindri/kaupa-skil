export interface OrderEmailData {
  poNumber: string
  supplierName: string
  organizationName: string
  deliveryDate?: string
  items: Array<{
    name: string
    sku: string
    quantity: number
    packSize: string
    unitPrice: number | null
  }>
  subtotal: number
  notes?: string
  contactName?: string
  contactEmail?: string
  contactPhone?: string
  deliveryAddress?: string
}

export type EmailLanguage = 'en' | 'is'

export function generateOrderSubject(
  poNumber: string,
  organizationName: string,
  language: EmailLanguage = 'en'
): string {
  if (language === 'is') {
    return `Pöntun ${poNumber} frá ${organizationName}`
  }
  return `Order ${poNumber} from ${organizationName}`
}

export function generateOrderEmailBody(
  data: OrderEmailData,
  language: EmailLanguage = 'en'
): string {
  const {
    poNumber,
    supplierName,
    organizationName,
    deliveryDate,
    items,
    subtotal,
    notes,
    contactName,
    contactEmail,
    contactPhone,
    deliveryAddress
  } = data

  if (language === 'is') {
    let body = `Góðan daginn,\n\n`
    body += `Við viljum leggja inn eftirfarandi pöntun:\n\n`
    body += `Pöntunarnúmer: ${poNumber}\n`
    body += `Fyrirtæki: ${organizationName}\n`
    if (deliveryDate) {
      body += `Óskuð afhendingardagsetning: ${deliveryDate}\n`
    }
    if (deliveryAddress) {
      body += `Afhendingarstaður: ${deliveryAddress}\n`
    }
    body += `\n--- Vörur ---\n\n`
    
    items.forEach(item => {
      const price = item.unitPrice ? `${item.unitPrice.toLocaleString('is-IS')} kr.` : 'Verð ekki til'
      body += `• ${item.name}\n`
      body += `  SKU: ${item.sku} | Magn: ${item.quantity} ${item.packSize} | Verð: ${price}\n\n`
    })
    
    body += `\nSamtals: ${subtotal.toLocaleString('is-IS')} kr. (án VSK)\n\n`
    
    if (notes) {
      body += `Athugasemdir:\n${notes}\n\n`
    }
    
    body += `--- Tengiliðaupplýsingar ---\n`
    if (contactName) body += `Nafn: ${contactName}\n`
    if (contactEmail) body += `Netfang: ${contactEmail}\n`
    if (contactPhone) body += `Sími: ${contactPhone}\n`
    
    body += `\nVinsamlegast staðfestið móttöku pöntunar.\n\n`
    body += `Með bestu kveðjum,\n${organizationName}`
    
    return body
  }

  // English version
  let body = `Hello,\n\n`
  body += `We would like to place the following order:\n\n`
  body += `PO Number: ${poNumber}\n`
  body += `Company: ${organizationName}\n`
  if (deliveryDate) {
    body += `Requested Delivery Date: ${deliveryDate}\n`
  }
  if (deliveryAddress) {
    body += `Delivery Address: ${deliveryAddress}\n`
  }
  body += `\n--- Items ---\n\n`
  
  items.forEach(item => {
    const price = item.unitPrice ? `${item.unitPrice.toLocaleString('en-US')} kr.` : 'Price not available'
    body += `• ${item.name}\n`
    body += `  SKU: ${item.sku} | Quantity: ${item.quantity} ${item.packSize} | Price: ${price}\n\n`
  })
  
  body += `\nSubtotal: ${subtotal.toLocaleString('en-US')} kr. (excl. VAT)\n\n`
  
  if (notes) {
    body += `Notes:\n${notes}\n\n`
  }
  
  body += `--- Contact Information ---\n`
  if (contactName) body += `Name: ${contactName}\n`
  if (contactEmail) body += `Email: ${contactEmail}\n`
  if (contactPhone) body += `Phone: ${contactPhone}\n`
  
  body += `\nPlease confirm receipt of this order.\n\n`
  body += `Best regards,\n${organizationName}`
  
  return body
}
