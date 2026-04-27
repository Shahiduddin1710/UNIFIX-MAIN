import { View } from 'react-native'
import { Skeleton } from 'moti/skeleton'

export default function ComplaintSkeleton() {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1.5, borderColor: '#f1f5f9' }}>
      {/* Status badge row */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <Skeleton colorMode="light" width={7} height={7} radius={4} />
        <Skeleton colorMode="light" width={80} height={24} radius={8} />
      </View>

      {/* Issue title */}
      <Skeleton colorMode="light" width="85%" height={16} radius={6} />
      <View style={{ marginTop: 8, gap: 6 }}>
        {/* Location row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Skeleton colorMode="light" width={13} height={13} radius={6} />
          <Skeleton colorMode="light" width={140} height={13} radius={6} />
        </View>
        {/* Date row */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          <Skeleton colorMode="light" width={13} height={13} radius={6} />
          <Skeleton colorMode="light" width={100} height={12} radius={6} />
        </View>
      </View>

      {/* Bottom track button row */}
      <View style={{ borderTopWidth: 1, borderTopColor: '#f1f5f9', marginTop: 14, paddingTop: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton colorMode="light" width={100} height={13} radius={6} />
        <Skeleton colorMode="light" width={13} height={13} radius={6} />
      </View>
    </View>
  )
}