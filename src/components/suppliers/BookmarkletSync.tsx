
import React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Copy, Bookmark, Globe, Timer, Shield } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

interface BookmarkletSyncProps {
  tenantId: string
  supplierId: string
  supplierDomainHint?: string
  className?: string
}

export function BookmarkletSync({ 
  tenantId, 
  supplierId, 
  supplierDomainHint, 
  className 
}: BookmarkletSyncProps) {
  const { toast } = useToast()
  
  // Use the Supabase function URL directly
  const ingestUrl = `https://hcrjkziycryuugzbixhq.supabase.co/functions/v1/ingest_har`
  const ingestToken = '' // Optional token for additional security

  const bookmarklet = React.useMemo(() => {
    // Compact, self-contained bookmarklet that captures network JSON for 10 seconds
    const payload = `
      (()=>{
        const ORG='${tenantId}', SUP='${supplierId}';
        const URL='${ingestUrl}';
        const TOK='${ingestToken}';
        const bar=document.createElement('div');
        bar.textContent='Kaupa: capturing for ~10s… scroll/paginate once';
        Object.assign(bar.style,{position:'fixed',top:0,left:0,right:0,zIndex:999999,background:'#111827',color:'#fff',padding:'8px',font:'12px system-ui',textAlign:'center',boxShadow:'0 2px 10px rgba(0,0,0,.2)'});
        document.documentElement.appendChild(bar);
        const keep=(u)=>/\\/(api|graphql|catalog|products|prices)/i.test(u||'');
        const cap=[]; const F=window.fetch;
        window.fetch=async(...a)=>{const r=await F(...a);try{const c=r.clone();const u=String(a[0]);if(keep(u)){const d=await c.json().catch(()=>null);if(d)cap.push({u,d,ts:Date.now()});}}catch{}return r;};
        const XO=XMLHttpRequest.prototype.open, XS=XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open=function(...a){this.__u=a[1];return XO.apply(this,a)};
        XMLHttpRequest.prototype.send=function(...a){this.addEventListener('load',function(){try{const u=this.__u||'';if(keep(u)){try{cap.push({u,d:JSON.parse(this.responseText),ts:Date.now()})}catch{}}}catch{}});return XS.apply(this,a)};
        setTimeout(async()=>{
          window.fetch=F;XMLHttpRequest.prototype.open=XO;XMLHttpRequest.prototype.send=XS;
          bar.textContent='Kaupa: uploading…';
          try{
            await fetch(URL,{method:'POST',headers:Object.assign({'content-type':'application/json'}, TOK?{'x-ingest-token':TOK}:{}),body:JSON.stringify({tenant_id:ORG,supplier_id:SUP,_captured:cap})});
            bar.textContent='Kaupa: done'; setTimeout(()=>bar.remove(),1200);
          }catch(e){ bar.textContent='Kaupa: upload failed'; setTimeout(()=>bar.remove(),2000); }
        },10000);
      })();
    `.replace(/\n+/g,"").replace(/\s{2,}/g," ");
    return `javascript:${encodeURIComponent(payload)}`;
  }, [tenantId, supplierId, ingestUrl, ingestToken]);

  const copyBookmarklet = async () => {
    try {
      await navigator.clipboard.writeText(bookmarklet)
      toast({
        title: "Copied to clipboard",
        description: "Create a new bookmark and paste the code into the URL field."
      })
    } catch {
      toast({
        variant: "destructive",
        title: "Copy failed",
        description: "Please drag the button to your bookmarks bar instead."
      })
    }
  }

  return (
    <Card className={cn("bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-base">Sync via Bookmarklet</CardTitle>
          <Badge variant="secondary" className="text-xs">No install required</Badge>
        </div>
        <CardDescription className="text-sm">
          Capture supplier data directly from their website without extensions or manual HAR files
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">1</span>
            Drag this button to your bookmarks bar:
          </div>
          
          <div className="flex items-center gap-3">
            <a 
              href={bookmarklet}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 hover:bg-black px-4 py-2 text-white text-sm font-medium shadow-sm transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              <Bookmark className="h-4 w-4" />
              Kaupa Capture
            </a>
            <Button
              variant="outline"
              size="sm"
              onClick={copyBookmarklet}
              className="text-xs"
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy code
            </Button>
          </div>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">2</span>
            <span>Go to the supplier's website {supplierDomainHint && (
              <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">{supplierDomainHint}</code>
            )}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">3</span>
            <span>Open their product catalog or search results</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">4</span>
            <span>Click <strong>Kaupa Capture</strong>, then scroll or browse for ~10 seconds</span>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">5</span>
            <span>Data uploads automatically when capture completes</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-blue-200">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Timer className="h-3 w-3 text-blue-500" />
            <span>10 second capture</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Globe className="h-3 w-3 text-blue-500" />
            <span>API data only</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Shield className="h-3 w-3 text-blue-500" />
            <span>User-initiated only</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
