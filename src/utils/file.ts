//获取assets静态资源
const getAssetsFile = (url:string)=>{
    return new URL(`../assets/imgs/${url}`,import.meta.url).href
}
//获取专利图片
const getPatentFile = (url:number)=>{
    return new URL(`../assets/imgs/patent/${url}.png`,import.meta.url).href
}
//获取荣誉图片
const getHonourFile = (url:number)=>{
    return new URL(`../assets/imgs/honor/${url}.jpg`,import.meta.url).href
}
//获取图层图片
const getLayerFile = (url:string)=>{
    return new URL(`../assets/imgs/layer/${url}`,import.meta.url).href
}

//获取mp4视频路径
const getVideoFile = (url:number)=>{
    return new URL(`../assets/video/${url}.mp4`,import.meta.url).href
}
//获取工艺流程图图
const getProcessFile = (url:string)=>{
    return new URL(`../assets/imgs/process/${url}.png`,import.meta.url).href
}
//获取产品展示图
const getProductFile = (url:string)=>{
    return new URL(`../assets/imgs/product/tinified/${url}.png`,import.meta.url).href
}
//获取json
const getJsonFile = (url:string)=>{
    return new URL(`../assets/geoJsonColl/${url}.json`,import.meta.url).href
}
//获取省份json
const getProvinceJsonFile = (url:string)=>{
    return new URL(`../assets/geoJsonColl/province/${url}.json`,import.meta.url).href
}
export {getAssetsFile,getPatentFile,getHonourFile,getLayerFile,getVideoFile,getProcessFile, getProductFile,getJsonFile,getProvinceJsonFile} 