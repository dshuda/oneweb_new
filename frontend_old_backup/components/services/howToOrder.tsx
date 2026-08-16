import { Fragment } from "react"

const HowToOrder:React.FC=()=> {
    return (
        <Fragment>
            <h1 className="font-bold text-[24px]">How To Place Order</h1>
            <h4 className="font-semibold">1. Select service :</h4>
            <p>From the category, select the service you are looking for.</p>
            <h4 className="font-semibold">2. Book your schedule:</h4>
            <p>Select your convenient time slot.</p>
            <h4 className="font-semibold">3. Place order:</h4>
            <p>Confirm your order by clicking 'Place order'.</p>
        </Fragment>
    )
}
export default HowToOrder;