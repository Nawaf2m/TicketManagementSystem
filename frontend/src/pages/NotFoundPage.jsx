import { Link } from 'react-router-dom'
import { ArrowLeft, Compass } from 'lucide-react'
export default function NotFoundPage() { return <div className="not-found"><span className="not-found-icon"><Compass size={42}/></span><h1>Page not found</h1><p>Looks like the page you're looking for doesn't exist.</p><Link className="btn btn-primary" to="/dashboard"><ArrowLeft size={17}/> Go to dashboard</Link></div> }
