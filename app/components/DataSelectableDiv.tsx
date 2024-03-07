import { glob } from 'glob'
import * as path from 'path'

import ShowSelectedData from '@/app/components/ShowSelectedData'

export default async function DataSelectableDiv() {
  const dataList = glob.globSync('public/data/*_gt.png').map((file) => {
    return path.basename(file).replace('_gt.png', '')
  })
  return <ShowSelectedData dataList={dataList} />
}
