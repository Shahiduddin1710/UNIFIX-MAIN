import { View } from 'react-native'
import { Skeleton } from 'moti/skeleton'

export default function AdminDashboardSkeleton() {
  return (
    <View style={{ flex: 1, backgroundColor: '#f0fdf4', paddingTop: 52 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingBottom: 12 }}>
        <Skeleton colorMode="light" width={40} height={40} radius={20} />
        <View style={{ gap: 5 }}>
          <Skeleton colorMode="light" width={60} height={14} radius={6} />
          <Skeleton colorMode="light" width={80} height={11} radius={6} />
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 20, gap: 8 }}>
        <Skeleton colorMode="light" width={220} height={26} radius={8} />
        <Skeleton colorMode="light" width={260} height={13} radius={6} />
      </View>

      <View style={{ marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 18, padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <View style={{ gap: 10 }}>
          <Skeleton colorMode="light" width={100} height={11} radius={6} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Skeleton colorMode="light" width={50} height={36} radius={6} />
            <Skeleton colorMode="light" width={60} height={24} radius={8} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
          {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 1.0].map((h, i) => (
            <Skeleton key={i} colorMode="light" width={8} height={Math.round(28 * h)} radius={3} />
          ))}
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 14, marginHorizontal: 20, marginBottom: 14 }}>
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 8, borderTopWidth: 3, borderTopColor: '#f59e0b' }}>
          <Skeleton colorMode="light" width={24} height={24} radius={12} />
          <Skeleton colorMode="light" width={40} height={28} radius={6} />
          <Skeleton colorMode="light" width={60} height={12} radius={6} />
        </View>
        <View style={{ flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 16, gap: 8, borderTopWidth: 3, borderTopColor: '#3b82f6' }}>
          <Skeleton colorMode="light" width={24} height={24} radius={12} />
          <Skeleton colorMode="light" width={40} height={28} radius={6} />
          <Skeleton colorMode="light" width={70} height={12} radius={6} />
        </View>
      </View>

<View style={{ marginHorizontal: 20, backgroundColor: '#e2f5eb', borderRadius: 18, padding: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, borderWidth: 1, borderColor: '#bbf7d0' }}>
        <View style={{ gap: 8 }}>
          <Skeleton colorMode="light" width={110} height={12} radius={6} />
          <Skeleton colorMode="light" width={50} height={36} radius={6} />
        </View>
        <Skeleton colorMode="light" width={48} height={48} radius={24} />
      </View>

      <View style={{ paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <Skeleton colorMode="light" width={130} height={18} radius={6} />
        <Skeleton colorMode="light" width={55} height={14} radius={6} />
      </View>

      {Array(3).fill(0).map((_, i) => (
        <View key={i} style={{ marginHorizontal: 20, backgroundColor: '#fff', borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 12 }}>
          <Skeleton colorMode="light" width={42} height={42} radius={12} />
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton colorMode="light" width="70%" height={13} radius={6} />
            <Skeleton colorMode="light" width="45%" height={11} radius={6} />
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <Skeleton colorMode="light" width={60} height={22} radius={8} />
            <Skeleton colorMode="light" width={40} height={11} radius={6} />
          </View>
        </View>
      ))}
    </View>
  )
}