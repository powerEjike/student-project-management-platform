import {Component,createRef,type ErrorInfo,type ReactNode} from 'react';

export default class AppErrorBoundary extends Component<{children:ReactNode},{failed:boolean}>{
 state={failed:false};
 private heading=createRef<HTMLHeadingElement>();
 static getDerivedStateFromError(){return{failed:true};}
 componentDidCatch(error:Error,_info:ErrorInfo){
  console.error('ProjectTrack screen could not render',error);
  this.heading.current?.focus();
 }
 render(){
  if(!this.state.failed)return this.props.children;
  return <main className="access-state" role="alert"><span className="eyebrow">PROJECTTRACK</span><h1 ref={this.heading} tabIndex={-1}>This screen could not open</h1><p>Check your connection, then refresh ProjectTrack to try again.</p><p className="muted">Refreshing may discard unsaved text.</p><button type="button" className="primary" onClick={()=>window.location.reload()}>Refresh ProjectTrack</button></main>;
 }
}
