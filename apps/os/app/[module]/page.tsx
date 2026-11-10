import Workspace from '../../components/workspace';
export default async function Page({params}:{params:Promise<{module:string}>}){const {module}=await params;return <Workspace module={module}/>}
