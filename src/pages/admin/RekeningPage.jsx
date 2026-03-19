import { Landmark } from 'lucide-react'

export default function RekeningPage() {
    const data = [
        { id: 1, bank: 'Bank BRI', noRek: '0987-6543-2100', atasNama: 'Yayasan PPRQ', status: 'aktif' },
        { id: 2, bank: 'Bank BSI', noRek: '1234-5678-9000', atasNama: 'Yayasan PPRQ', status: 'aktif' },
    ]

    return (
        <div className="fade-in">
            <div className="page-header">
                <h1>Rekening Bank</h1>
                <div className="actions">
                    <button className="btn btn-primary">+ Tambah</button>
                </div>
            </div>
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: 60 }}>No</th>
                            <th>Bank</th>
                            <th>No. Rekening</th>
                            <th>Atas Nama</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((d, i) => (
                            <tr key={d.id}>
                                <td>{i + 1}</td>
                                <td style={{ fontWeight: 500 }}><Landmark size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} />{d.bank}</td>
                                <td className="mono">{d.noRek}</td>
                                <td>{d.atasNama}</td>
                                <td><span className="badge badge-success">Aktif</span></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
