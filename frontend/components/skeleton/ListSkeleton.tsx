import { View } from 'react-native'
import CardSkeleton from './CardSkeleton'

type Props = {
  count?: number
}

export default function ListSkeleton({ count = 3 }: Props) {
  return (
    <View style={{ flex: 1, paddingHorizontal: 16, paddingTop: 16 }}>
      {Array(count).fill(0).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </View>
  )
}