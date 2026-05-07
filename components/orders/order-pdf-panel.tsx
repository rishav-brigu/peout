import { usePDF } from '@react-pdf/renderer'
import { PDFViewer } from '@react-pdf/renderer'
import { useMemo } from 'react'
import { Loader2, Download, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { OrderDocument, type CopyType } from '@/components/pdf/order-document'
import type { OrderDetailData } from '@/app/(app)/orders/actions'

interface OrderPdfPanelProps {
  order: OrderDetailData
  copyType: CopyType
}

export default function OrderPdfPanel({ order, copyType }: OrderPdfPanelProps) {
  const doc = useMemo(
    () => <OrderDocument order={order} copyType={copyType} />,
    [order, copyType]
  )
  const [instance] = usePDF({ document: doc })

  const filename = `${order.order_number}-${copyType}-copy.pdf`

  function handlePrint() {
    if (instance.url) window.open(instance.url)
  }

  return (
    <div className="space-y-4">
      {/* Action buttons */}
      <div className="flex items-center gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrint}
          disabled={instance.loading}
          className="border-[#E7E3DC] gap-1.5"
        >
          <Printer size={14} />
          Print
        </Button>

        {instance.loading ? (
          <Button size="sm" disabled className="gap-1.5">
            <Loader2 size={14} className="animate-spin" />
            Generating…
          </Button>
        ) : instance.url ? (
          <a href={instance.url} download={filename}>
            <Button size="sm" className="bg-[#92400E] hover:bg-[#78350F] text-white gap-1.5">
              <Download size={14} />
              Download PDF
            </Button>
          </a>
        ) : null}
      </div>

      {/* PDF preview */}
      <div className="border border-[#E7E3DC] rounded-xl overflow-hidden">
        <PDFViewer width="100%" height={780} showToolbar={false}>
          {doc}
        </PDFViewer>
      </div>
    </div>
  )
}
