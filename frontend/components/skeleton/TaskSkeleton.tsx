import { View } from 'react-native'
import { Skeleton } from 'moti/skeleton'

export default function TaskSkeleton() {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 14, borderWidth: 1.5, borderColor: '#f1f5f9' }}>
      <Skeleton colorMode="light" width="100%" height={180} radius={0} />
      <View style={{ padding: 14, gap: 10 }}>
        <Skeleton colorMode="light" width="80%" height={16} radius={6} />
        <Skeleton colorMode="light" width={80} height={24} radius={6} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Skeleton colorMode="light" width={16} height={16} radius={8} />
          <Skeleton colorMode="light" width={120} height={13} radius={6} />
        </View>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          <Skeleton colorMode="light" width="48%" height={42} radius={10} />
          <Skeleton colorMode="light" width="48%" height={42} radius={10} />
        </View>
      </View>
    </View>
  )
}