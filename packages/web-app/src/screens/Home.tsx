import React from 'react';
import { Outlet } from 'react-router-dom';
import './Home.scss';

function Home() {
  const domainArray = window.location.host.split(".");
  if (domainArray.length > 2 && domainArray.length < 5) {
    // grab the subdomain & domain
    const [ subdomain, ...domain ] = domainArray;

    console.log('redirect', {subdomain, domain});
    
    if (subdomain !== 'www') {
      window.location.assign(`https://survey.${domain.join('.')}/s/${subdomain.toLowerCase()}/`);
    }
  }

  return (
    <div className="Home">
        <h1>Nobody's supposed to be here.</h1>
        <p>- Debroah Cox</p>
      <Outlet />
    </div>
  );
}

export default Home;
