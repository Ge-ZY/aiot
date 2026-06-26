export interface CameraItem {
  id: string
  name: string
  type: string
  location: string
  status: '在线' | '离线'
  barnId?: number
}

/** 厂区级摄像头 */
export const factoryCameras: CameraItem[] = [
  { id: 'CAM-F-001', name: '厂区大门', type: '全景摄像头', location: '正门入口', status: '在线' },
  { id: 'CAM-F-002', name: '饲料仓库', type: '球型摄像头', location: '仓库区', status: '在线' },
  { id: 'CAM-F-003', name: '中控室', type: '全景摄像头', location: '中控室', status: '在线' },
  { id: 'CAM-F-004', name: '厂区周界', type: '热成像摄像头', location: '北侧围墙', status: '在线' },
  { id: 'CAM-F-005', name: '污水处理站', type: '枪机摄像头', location: '环保区', status: '离线' },
  { id: 'CAM-F-006', name: '装卸区', type: '枪机摄像头', location: '物流区', status: '在线' },
  { id: 'CAM-F-007', name: '办公楼入口', type: '半球摄像头', location: '办公区', status: '在线' },
  { id: 'CAM-F-008', name: '停车场', type: '全景摄像头', location: '南门停车场', status: '在线' },
  { id: 'CAM-F-009', name: '原料仓库', type: '球型摄像头', location: '原料区', status: '在线' },
  { id: 'CAM-F-010', name: '成品仓库', type: '枪机摄像头', location: '成品区', status: '在线' },
  { id: 'CAM-F-011', name: '锅炉房', type: '红外摄像头', location: '动力车间', status: '在线' },
  { id: 'CAM-F-012', name: '配电室', type: '枪机摄像头', location: '配电间', status: '在线' },
  { id: 'CAM-F-013', name: '东侧周界', type: '热成像摄像头', location: '东侧围墙', status: '在线' },
  { id: 'CAM-F-014', name: '西侧周界', type: '热成像摄像头', location: '西侧围墙', status: '离线' },
  { id: 'CAM-F-015', name: '南门岗亭', type: '半球摄像头', location: '南门', status: '在线' },
  { id: 'CAM-F-016', name: '北门岗亭', type: '半球摄像头', location: '北门', status: '在线' },
  { id: 'CAM-F-017', name: '消防通道', type: '枪机摄像头', location: '消防通道', status: '在线' },
  { id: 'CAM-F-018', name: '食堂后厨', type: '红外摄像头', location: '生活区', status: '在线' },
  { id: 'CAM-F-019', name: '宿舍区入口', type: '全景摄像头', location: '宿舍区', status: '在线' },
  { id: 'CAM-F-020', name: '厂区全景', type: '全景摄像头', location: '制高点', status: '在线' },
]

/** 舍内摄像头（按栏舍 id 关联） */
export const barnCameras: CameraItem[] = [
  { id: 'CAM-B-101', name: '保育舍1-东侧', type: '红外摄像头', location: '保育舍1 东栏', status: '在线', barnId: 1 },
  { id: 'CAM-B-102', name: '保育舍1-西侧', type: '红外摄像头', location: '保育舍1 西栏', status: '在线', barnId: 1 },
  { id: 'CAM-B-103', name: '保育舍1-走道', type: '半球摄像头', location: '保育舍1 中央走道', status: '在线', barnId: 1 },
  { id: 'CAM-B-201', name: '保育舍2-全景', type: '全景摄像头', location: '保育舍2', status: '在线', barnId: 2 },
  { id: 'CAM-B-202', name: '保育舍2-饮水区', type: '红外摄像头', location: '保育舍2 饮水点', status: '在线', barnId: 2 },
  { id: 'CAM-B-301', name: '分娩舍1-产床区', type: '红外摄像头', location: '分娩舍1 产床', status: '在线', barnId: 3 },
  { id: 'CAM-B-302', name: '分娩舍1-仔猪区', type: '红外摄像头', location: '分娩舍1 仔猪保温', status: '在线', barnId: 3 },
  { id: 'CAM-B-401', name: '保育舍4-全景', type: '全景摄像头', location: '保育舍4', status: '在线', barnId: 4 },
  { id: 'CAM-B-402', name: '保育舍4-通风口', type: '枪机摄像头', location: '保育舍4 通风口', status: '离线', barnId: 4 },
  { id: 'CAM-B-601', name: '分娩舍2-全景', type: '全景摄像头', location: '分娩舍2', status: '在线', barnId: 6 },
  { id: 'CAM-B-602', name: '分娩舍2-走道', type: '半球摄像头', location: '分娩舍2 走道', status: '在线', barnId: 6 },
  { id: 'CAM-B-1011', name: '蛋鸡舍1-笼架A', type: '红外摄像头', location: '蛋鸡舍1 A区', status: '在线', barnId: 101 },
  { id: 'CAM-B-1012', name: '蛋鸡舍1-笼架B', type: '红外摄像头', location: '蛋鸡舍1 B区', status: '在线', barnId: 101 },
  { id: 'CAM-B-1021', name: '蛋鸡舍2-全景', type: '全景摄像头', location: '蛋鸡舍2', status: '在线', barnId: 102 },
  { id: 'CAM-B-1031', name: '肉鸡舍1-活动区', type: '红外摄像头', location: '肉鸡舍1', status: '在线', barnId: 103 },
  { id: 'CAM-B-2011', name: '养殖池1-水面', type: '防水摄像头', location: '养殖池1 水面', status: '在线', barnId: 201 },
  { id: 'CAM-B-2012', name: '养殖池1-投饵区', type: '枪机摄像头', location: '养殖池1 投饵台', status: '在线', barnId: 201 },
  { id: 'CAM-B-2031', name: '养殖池3-全景', type: '防水摄像头', location: '养殖池3', status: '在线', barnId: 203 },
  { id: 'CAM-B-2032', name: '养殖池3-增氧区', type: '枪机摄像头', location: '养殖池3 增氧机', status: '离线', barnId: 203 },
]

export const getBarnCameras = (barnId: number) =>
  barnCameras.filter(c => c.barnId === barnId)
