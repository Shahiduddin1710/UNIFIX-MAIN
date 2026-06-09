import { View } from 'react-native'
import { Skeleton } from 'moti/skeleton'

export default function DashboardSkeleton() {
  return (
    <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 20, gap: 16 }}>
      <View style={{ alignItems: 'center', paddingBottom: 8 }}>
        <Skeleton colorMode="light" width={80} height={18} radius={6} />
      </View>

      <View style={{ gap: 8 }}>
        <Skeleton colorMode="light" width={200} height={28} radius={8} />
        <Skeleton colorMode="light" width={260} height={14} radius={6} />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton colorMode="light" width={130} height={18} radius={6} />
        <Skeleton colorMode="light" width={60} height={14} radius={6} />
      </View>

      {Array(3).fill(0).map((_, i) => (
        <View key={i} style={{ backgroundColor: '#fff', borderRadius: 14, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: '#f1f5f9', gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
            <Skeleton colorMode="light" width={40} height={40} radius={10} />
            <View style={{ gap: 6, flex: 1 }}>
              <Skeleton colorMode="light" width="70%" height={14} radius={6} />
              <Skeleton colorMode="light" width="50%" height={11} radius={6} />
            </View>
          </View>
          <Skeleton colorMode="light" width={60} height={26} radius={8} />
        </View>
      ))}
    </View>
  )
}