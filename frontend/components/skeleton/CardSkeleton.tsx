import { View } from 'react-native'
import { Skeleton } from 'moti/skeleton'

export default function CardSkeleton() {
  return (
    <View style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 14, borderWidth: 1.5, borderColor: '#f1f5f9', padding: 14, gap: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Skeleton colorMode="light" width={38} height={38} radius={10} />
        <View style={{ gap: 6 }}>
          <Skeleton colorMode="light" width={120} height={14} radius={6} />
          <Skeleton colorMode="light" width={80} height={11} radius={6} />
        </View>
      </View>
      <Skeleton colorMode="light" width="100%" height={180} radius={10} />
      <Skeleton colorMode="light" width="60%" height={18} radius={6} />
      <Skeleton colorMode="light" width="90%" height={13} radius={6} />
      <Skeleton colorMode="light" width="75%" height={13} radius={6} />
    </View>
  )
}