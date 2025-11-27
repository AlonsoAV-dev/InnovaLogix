import { useEffect, useState } from "react";
import './SalesOverview.css';
import { DollarSign, ShoppingBag, CreditCard } from 'lucide-react';

export default function SalesOverview() {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("http://localhost:3001/api/reportes/ventas-detalle");
        const data = await res.json();
        setVentas(data);
      } catch (err) {
        console.error("Error cargando ventas detalle:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="p-6 text-xl font-semibold text-gray-700">
        Cargando reportes...
      </div>
    );
  }

  // KPIs
  const totalSales = ventas.reduce((sum, v) => sum + Number(v.total), 0);
  const totalOrders = ventas.length;
  const avgTicket = totalOrders > 0 ? (totalSales / totalOrders).toFixed(2) : 0;
  const totalUnits = ventas.reduce((sum, v) => sum + Number(v.total_unidades ?? 0), 0);

  return (
    <div className="p-6">
      {/* Título */}
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Resumen de Ventas
        </h2>
         
        <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon money">
                        <DollarSign size={24} />
                    </div>
                    <div className="metric-info">
                        <h3>S/ {totalSales}</h3>
                        <p>Ventas Totales</p>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon orders">
                        <ShoppingBag size={24} />
                    </div>
                    <div className="metric-info">
                        <h3>{totalOrders}</h3>
                        <p>Total Pedidos</p>
                    </div>
                </div>
                <div className="metric-card">
                    <div className="metric-icon ticket">
                        <CreditCard size={24} />
                    </div>
                    <div className="metric-info">
                        <h3>S/ {avgTicket}</h3>
                        <p>Ticket Promedio</p>
                    </div>
                </div>
        </div>

     
      
      {/* Tabla */}
      
        <table className="sales-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>ID Venta</th>
              <th>Método de Pago</th>
              <th>Items</th>
              <th>Unidades</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {ventas.map((v) => (
              <tr key={v.sale_id}>
                <td>{new Date(v.date).toLocaleString()}</td>
                <td>{v.sale_id}</td>
                <td className="capitalize">{v.paymentmethod}</td>
                <td>{v.total_items}</td>
                <td>{v.total_unidades}</td> 
                <td>S/ {v.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
    </div>
  );
}
