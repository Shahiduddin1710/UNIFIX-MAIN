import { View } from 'react-native'
import { Skeleton } from 'moti/skeleton'

export default function StaffDashboardSkeleton() {
  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 24, gap: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Skeleton colorMode="light" width={36} height={36} radius={18} />
          <Skeleton colorMode="light" width={80} height={18} radius={6} />
        </View>
        <Skeleton colorMode="light" width={36} height={36} radius={18} />
      </View>

      <View style={{ backgroundColor: '#f0fdf4', borderRadius: 16, padding: 20, gap: 10, borderWidth: 1, borderColor: '#bbf7d0' }}>
        <Skeleton colorMode="light" width={100} height={11} radius={6} />
        <Skeleton colorMode="light" width={180} height={22} radius={6} />
        <Skeleton colorMode="light" width={140} height={13} radius={6} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {Array(4).fill(0).map((_, i) => (
          <View key={i} style={{ width: '47%', backgroundColor: '#fff', borderRadius: 14, padding: 14, gap: 10, borderWidth: 1.5, borderColor: '#f1f5f9' }}>
            <Skeleton colorMode="light" width={36} height={36} radius={10} />
            <Skeleton colorMode="light" width={60} height={11} radius={6} />
            <Skeleton colorMode="light" width={40} height={26} radius={6} />
            <Skeleton colorMode="light" width={80} height={11} radius={6} />
          </View>
        ))}
      </View>

      <Skeleton colorMode="light" width={120} height={18} radius={6} />

      {Array(2).fill(0).map((_, i) => (
        <View key={i} style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: '#f1f5f9' }}>
          <Skeleton colorMode="light" width="100%" height={160} radius={0} />
          <View style={{ padding: 14, gap: 10 }}>
            <Skeleton colorMode="light" width="80%" height={16} radius={6} />
            <Skeleton colorMode="light" width={80} height={24} radius={6} />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <Skeleton colorMode="light" width="48%" height={42} radius={10} />
              <Skeleton colorMode="light" width="48%" height={42} radius={10} />
            </View>
          </View>
        </View>
      ))}
    </View>
  )
}