import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer'
import type { OrderDetailData } from '@/app/(app)/orders/actions'
import type { AgentConfig } from '@/app/(app)/settings/actions'

export type CopyType = 'buyer' | 'manufacturer'

function fmt(n: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(n)
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    paddingTop: 40,
    paddingBottom: 52,
    paddingHorizontal: 42,
    backgroundColor: '#FFFFFF',
    color: '#1C1917',
  },

  // ── Header ────────────────────────────────────────────────────
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  brandName: { fontFamily: 'Times-Bold', fontSize: 22, color: '#92400E' },
  brandSub: { fontSize: 8, color: '#78716C', marginTop: 3 },
  agentName: { fontFamily: 'Helvetica-Bold', fontSize: 9, textAlign: 'right' },
  agentDetail: { fontSize: 8, color: '#78716C', textAlign: 'right', marginTop: 2 },

  // ── Divider ───────────────────────────────────────────────────
  divider: { borderBottomWidth: 1, borderBottomColor: '#E7E3DC', marginBottom: 14 },

  // ── Title row ─────────────────────────────────────────────────
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  orderTitle: { fontFamily: 'Times-Bold', fontSize: 22, color: '#1C1917' },
  copyLabel: { fontFamily: 'Times-Italic', fontSize: 9, color: '#78716C', marginTop: 4 },
  metaLine: { fontSize: 8, color: '#78716C', textAlign: 'right', marginBottom: 2 },
  metaOrderNum: { fontFamily: 'Helvetica-Bold', fontSize: 9, textAlign: 'right' },
  metaStatus: { fontSize: 8, color: '#92400E', fontFamily: 'Helvetica-Bold', textAlign: 'right', marginTop: 2 },

  // ── Parties ───────────────────────────────────────────────────
  partiesRow: { flexDirection: 'row', marginBottom: 18 },
  partyBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E7E3DC',
    borderRadius: 4,
    padding: 10,
  },
  partyBoxLeft: { marginRight: 8 },
  partyBoxLabel: {
    fontSize: 7,
    color: '#78716C',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  partyBoxName: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#1C1917', marginBottom: 3 },
  partyBoxDetail: { fontSize: 8, color: '#78716C', marginBottom: 2 },

  // ── Items table ───────────────────────────────────────────────
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1C1917',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 3,
    marginBottom: 1,
  },
  thCell: { fontFamily: 'Helvetica-Bold', fontSize: 7, color: '#FFFFFF', textTransform: 'uppercase' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E7E3DC',
  },
  tdCell: { fontSize: 8.5, color: '#1C1917' },
  tdMuted: { fontSize: 8.5, color: '#78716C' },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderTopWidth: 1.5,
    borderTopColor: '#1C1917',
    marginTop: 2,
    marginBottom: 18,
  },
  totalLabel: { fontFamily: 'Helvetica-Bold', fontSize: 9 },
  totalAmount: { fontFamily: 'Helvetica-Bold', fontSize: 11, color: '#92400E', textAlign: 'right' },

  // column widths
  cIdx: { width: 18 },
  cProduct: { flex: 1, paddingRight: 6 },
  cQty: { width: 36, textAlign: 'right' },
  cUnit: { width: 32 },
  cRate: { width: 68, textAlign: 'right' },
  cAmount: { width: 72, textAlign: 'right' },

  // ── Section ───────────────────────────────────────────────────
  section: { marginBottom: 14 },
  sectionLabel: {
    fontSize: 7,
    color: '#78716C',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  sectionText: { fontSize: 9, color: '#1C1917' },
  sectionItalic: { fontFamily: 'Helvetica-Oblique', fontSize: 9, color: '#78716C' },

  // ── Signature ─────────────────────────────────────────────────
  sigBlock: { marginTop: 36, alignItems: 'flex-end' },
  sigLine: { width: 170, borderTopWidth: 1, borderTopColor: '#1C1917', paddingTop: 7, alignItems: 'flex-end' },
  sigName: { fontFamily: 'Helvetica-BoldOblique', fontSize: 9, color: '#1C1917' },
  sigTitle: { fontSize: 8, color: '#78716C', marginTop: 3 },
})

interface OrderDocumentProps {
  order: OrderDetailData
  copyType: CopyType
  agent: AgentConfig
}

export function OrderDocument({ order, copyType, agent }: OrderDocumentProps) {
  const isBuyer = copyType === 'buyer'
  const copyLabel = isBuyer ? 'Buyer copy' : 'Manufacturer copy'

  const total = order.order_items.reduce(
    (sum, item) =>
      sum +
      (isBuyer ? item.sell_price_snapshot : item.mfr_price_snapshot) * item.quantity,
    0
  )

  return (
    <Document
      title={`${order.order_number} — ${copyLabel}`}
      author={agent.name}
    >
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.brandName}>PeOut</Text>
            <Text style={s.brandSub}>Commission Trading · Sleeping Accessories</Text>
          </View>
          <View>
            <Text style={s.agentName}>{agent.name}</Text>
            {agent.address ? <Text style={s.agentDetail}>{agent.address}</Text> : null}
            {agent.phone ? <Text style={s.agentDetail}>{agent.phone}</Text> : null}
            {agent.email ? <Text style={s.agentDetail}>{agent.email}</Text> : null}
          </View>
        </View>

        <View style={s.divider} />

        {/* Title row */}
        <View style={s.titleRow}>
          <View>
            <Text style={s.orderTitle}>Order Note</Text>
            <Text style={s.copyLabel}>{copyLabel}</Text>
          </View>
          <View>
            <Text style={s.metaOrderNum}>{order.order_number}</Text>
            <Text style={s.metaLine}>{fmtDate(order.created_at)}</Text>
            <Text style={s.metaStatus}>{order.order_status}</Text>
          </View>
        </View>

        {/* Parties */}
        <View style={s.partiesRow}>
          <View style={[s.partyBox, s.partyBoxLeft]}>
            <Text style={s.partyBoxLabel}>From — Manufacturer</Text>
            <Text style={s.partyBoxName}>{order.manufacturer_name}</Text>
            {order.manufacturer_city ? (
              <Text style={s.partyBoxDetail}>{order.manufacturer_city}</Text>
            ) : null}
            {order.manufacturer_phone ? (
              <Text style={s.partyBoxDetail}>{order.manufacturer_phone}</Text>
            ) : null}
          </View>
          <View style={s.partyBox}>
            <Text style={s.partyBoxLabel}>To — Buyer</Text>
            <Text style={s.partyBoxName}>{order.buyer_name}</Text>
            {order.buyer_city ? (
              <Text style={s.partyBoxDetail}>{order.buyer_city}</Text>
            ) : null}
            {order.buyer_gstin ? (
              <Text style={s.partyBoxDetail}>GST: {order.buyer_gstin}</Text>
            ) : null}
          </View>
        </View>

        {/* Items table */}
        <View style={s.tableHeader}>
          <Text style={[s.thCell, s.cIdx]}>#</Text>
          <Text style={[s.thCell, s.cProduct]}>Product</Text>
          <Text style={[s.thCell, s.cQty]}>Qty</Text>
          <Text style={[s.thCell, s.cUnit]}>Unit</Text>
          <Text style={[s.thCell, s.cRate]}>Rate</Text>
          <Text style={[s.thCell, s.cAmount]}>Amount</Text>
        </View>

        {order.order_items.map((item, i) => {
          const rate = isBuyer ? item.sell_price_snapshot : item.mfr_price_snapshot
          const amount = rate * item.quantity
          return (
            <View key={item.id} style={s.tableRow}>
              <Text style={[s.tdMuted, s.cIdx]}>{i + 1}</Text>
              <Text style={[s.tdCell, s.cProduct]}>{item.product_name}</Text>
              <Text style={[s.tdMuted, s.cQty]}>{item.quantity}</Text>
              <Text style={[s.tdMuted, s.cUnit]}>{item.unit}</Text>
              <Text style={[s.tdCell, s.cRate]}>{fmt(rate)}</Text>
              <Text style={[s.tdCell, s.cAmount]}>{fmt(amount)}</Text>
            </View>
          )
        })}

        <View style={s.totalRow}>
          <Text style={[s.totalLabel, s.cIdx]} />
          <Text style={[s.totalLabel, s.cProduct]} />
          <Text style={[s.totalLabel, s.cQty]} />
          <Text style={[s.totalLabel, s.cUnit]} />
          <Text style={[s.totalLabel, s.cRate]}>Total</Text>
          <Text style={[s.totalAmount, s.cAmount]}>{fmt(total)}</Text>
        </View>

        {/* Payment terms */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Payment terms</Text>
          <Text style={s.sectionText}>
            {order.payment_terms === 'installments'
              ? `${order.installments ?? ''} installments`
              : 'Single payment — full amount on delivery'}
          </Text>
        </View>

        {/* Notes */}
        {order.notes ? (
          <View style={s.section}>
            <Text style={s.sectionLabel}>Notes</Text>
            <Text style={s.sectionItalic}>{order.notes}</Text>
          </View>
        ) : null}

        {/* Signature */}
        <View style={s.sigBlock}>
          <View style={s.sigLine}>
            <Text style={s.sigName}>{agent.name}</Text>
            <Text style={s.sigTitle}>Authorised signatory · PeOut</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
