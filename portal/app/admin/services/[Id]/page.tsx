'use client'
import TiptapEditor from "@/components/Editor/Open"
import { useParams } from "next/navigation";
import React, { useEffect } from "react";
import { Fragment } from "react"
import api from '@/lib/api';
// Crucial for Next.js App Router

const ContentSetup = () => {
  const params = useParams()

  const serviceId = Number(params.Id)
  const [content, setContent] = React.useState({ about: 'testing content', faq: 'testing faq', detail: 'testing detaiuls' });
  const [isLoading, setLoading] = React.useState(false);
  const fetchServicesContent = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/api/v1/admin/services/content/${serviceId}`);
      const res = response.data.data || {};
      setContent({ about: res.about || '', faq: res.faq || '', detail: res.detail || '' });
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchServicesContent();
  }, [serviceId])

 const UpdateContent=async ()=>{
        await api.put(`/api/v1/admin/services/content/${serviceId}`, content);
}


  return (
    <Fragment>
      {isLoading ? <p>Loading...</p> : <Fragment>

        <div className="clearfix">
          <h3>About</h3>
          <TiptapEditor content={content.about} onChange={(newContent) => setContent({ ...content, about: newContent })} />
        </div>
        <div className="clearfix">
          <h3>FAQ</h3>
          <TiptapEditor content={content.faq} onChange={(newContent) => setContent({ ...content, faq: newContent })} />
        </div>
        <div className="clearfix">
          <h3>Detail</h3>
          <TiptapEditor content={content.detail} onChange={(newContent) => setContent({ ...content, detail: newContent })} />
        </div>
      </Fragment>}


      <div className="clearfix te">
        <button type="button" onClick={UpdateContent}>Update</button>
      </div>
    </Fragment>
  )
}

export default ContentSetup