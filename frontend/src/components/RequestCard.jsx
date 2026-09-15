function RequestCard(props) {
    let action

    /* Collegare i pulsanti al PATCH*/
    if(props.status === 'Nuova'){
    action = (
        <button 
            className="request-status-button"
            onClick={() => props.onStatusChange(props.id, 'In lavorazione')}>  
            Prendi in carico
        </button>  
    )
    }else if(props.status === 'In lavorazione'){
    action = (
        <button 
            className="request-status-button"
            onClick={() => props.onStatusChange(props.id, 'Risolta')}>
            Segna come risolta
        </button>
    )
    }else {
    action = <p className="request-completed">
                Richiesta completata
            </p>
}

    return (
        <div className="request-card">
            <h2>{props.title}</h2>
            <p className="request-description">Description: {props.description}</p>
            <div className="request-info"> 
                <div className="request-info-item"> 
                    <span>Stato</span> 
                    <strong>{props.status}</strong> 
                </div> 
                    <div className="request-info-item"> 
                        <span>Categoria</span> 
                        <strong>{props.category}</strong> 
                    </div> 
            </div>

            {props.role === 'admin' &&( 
            <div className="request-category"> 
            <label> 
                Modifica categoria 
            </label>

            <select
                value={props.category}   
                onChange={(e) => props.onCategoryChange(props.id, e.target.value)}
            >
                <option value="Da classificare">Da classificare</option>
                <option value="Licenze">Licenze</option>
                <option value="Infrastrutture">Infrastrutture</option>
                <option value="Consulenze">Consulenze</option>
                <option value="Attività di formazione">Attività di formazione</option>
                <option value="Software">Software</option>
                <option value="Hardware">Hardware</option>
                <option value="Rete">Rete</option>
                <option value="Account">Account</option>
                <option value="Accesso ai servizi">Accesso ai servizi</option>
                <option value="Altro">Altro</option>
            </select>
            </div>
            )}
 
           {/* AZIONI ADMIN */} 
           {props.role === 'admin' && ( 
            
            <div className="request-actions"> 
                {action} 
                <button className="request-delete-button" 
                    onClick={() => props.onDelete(props.id)} > 
                        Elimina 
                </button> 
            </div> 
            )} 
        </div> 
        ) 
    } 

    export default RequestCard
