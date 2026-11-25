
import { useState, useEffect } from 'react'
import './App.css'
import AdminLogin from './AdminLogin'
import { supabase } from './supabase'

const ADMIN_WHATSAPP = '918889367711'

const districts = [
  'Indore', 'Bhopal', 'Ujjain', 'Dewas', 'Dhar', 'Pithampur',
  'Jabalpur', 'Gwalior', 'Ratlam', 'Sagar', 'Rewa', 'Satna',
  'Mandsaur', 'Neemuch', 'Khargone', 'Khandwa', 'Burhanpur',
  'Shajapur', 'Sehore', 'Raisen', 'Vidisha', 'Narmadapuram',
  'Betul', 'Chhindwara', 'Seoni', 'Balaghat', 'Mandla', 'Dindori',
  'Katni', 'Umaria', 'Shahdol', 'Anuppur', 'Sidhi', 'Singrauli',
  'Panna', 'Chhatarpur', 'Tikamgarh', 'Niwari', 'Damoh', 'Datia',
  'Shivpuri', 'Guna', 'Ashoknagar', 'Morena', 'Bhind', 'Sheopur',
  'Barwani', 'Alirajpur', 'Jhabua', 'Agar Malwa', 'Maihar',
  'Mauganj', 'Pandhurna', 'Other MP Location'
]

const equipmentTypes = [
  'Mobile Crane', 'Hydra Crane', 'Tower Crane', 'Crawler Crane',
  'Truck Crane', 'JCB', 'Excavator', 'Forklift', 'Backhoe Loader',
  'Boom Lift', 'Road Roller', 'Wheel Loader', 'Concrete Mixer',
  'Other Equipment'
]

const categories = [
  {
    name: 'Mobile Crane',
    detail: 'Heavy lifting solutions',
    image: 'https://galfformation.com/images/formations/grue-mobile.png?v=3'
  },
  {
    name: 'Hydra Crane',
    detail: 'Pick and carry cranes',
    image: 'https://static.wixstatic.com/media/d9f43e_7285e2fe1f3441bead1cd2f8e8f88ea6~mv2.jpg/v1/fill/w_980%2Ch_735%2Cal_c%2Cq_85%2Cusm_0.66_1.00_0.01%2Cenc_avif%2Cquality_auto/PICK%20AND%20CARRY%20CRANE.jpg'
  },
  {
    name: 'Tower Crane',
    detail: 'High-rise construction',
    image: 'https://image.made-in-china.com/202f0j00mMQTrfZzqCRY/Tower-Crane-QTZ-1100-.jpg'
  },
  {
    name: 'Crawler Crane',
    detail: 'Heavy-duty lifting',
    image: 'https://images.squarespace-cdn.com/content/v1/67bb00a9e099914bf7ff16d2/cc8f169e-fb5b-474f-962b-e16544e172cd/ltr%2B1150.jpg?format=2500w'
  },
  {
    name: 'JCB',
    detail: 'Earthmoving equipment',
    image: 'https://t1.blockdit.com/photos/2026/01/695cc0e219c08b185bdb5a46_800x0xcover_YECKtQ2W.jpg'
  },
  {
    name: 'Excavator',
    detail: 'Digging and excavation',
    image: 'https://operatorpro.co.uk/images/courses/360-excavator.jpg'
  },
  {
    name: 'Forklift',
    detail: 'Industrial material handling',
    image: 'https://www.bowdentransport.com/content/images/feature-image-warehouse-mobile.jpg'
  },
  {
    name: 'Boom Lift',
    detail: 'Elevated work platforms',
    image: 'https://blog.iseekplant.com.au/hs-fs/hubfs/cherry-picker-construction-site.jpg?width=1500'
  }
]

// Price ko Indian currency format mein dikhata hai.
// 30000/day -> ₹30,000/day
// 250000/month -> ₹2,50,000/month
const formatCustomerPrice = (value) => {
  const price = String(value || '').trim()

  if (!price) return 'Price on request'

  const match = price.match(/^₹?\s*([\d,]+(?:\.\d+)?)(.*)$/)

  if (!match) return price

  const amount = Number(match[1].replace(/,/g, ''))

  if (!Number.isFinite(amount)) return price

  const formattedAmount = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2
  }).format(amount)

  return `₹${formattedAmount}${match[2]}`
}

const getPriceUnit = (value) => {
  const price = String(value || '').toLowerCase()

  if (/\/\s*(month|monthly)\s*$/.test(price)) return 'month'
  if (/\/\s*(day|daily)\s*$/.test(price)) return 'day'

  return 'day'
}

const getPriceWithoutUnit = (value) => {
  return String(value || '')
    .replace(/\/\s*(day|daily|month|monthly)\s*$/i, '')
    .trim()
}

const mapSupplierRow = (item) => ({
  id: item.id,
  company: item.company,
  owner: item.owner,
  phone: item.phone,
  equipment: item.equipment,
  mode: item.mode,
  district: item.district,
  supplierPrice: item.supplier_price,
  capacity: item.capacity,
  condition: item.condition,
  description: item.description,
  customerPrice: item.customer_price || '',
  status: item.status,
  date: item.created_at
    ? new Date(item.created_at).toLocaleString('en-IN')
    : ''
})

const mapEnquiryRow = (item) => ({
  id: item.id,
  name: item.name,
  phone: item.phone,
  mode: item.mode,
  equipment: item.equipment,
  district: item.district,
  duration: item.duration,
  budget: item.budget,
  details: item.details,
  date: item.created_at
    ? new Date(item.created_at).toLocaleString('en-IN')
    : ''
})

const mapPublicRow = (item) => ({
  id: item.submission_id || item.id,
  publicId: item.id,
  equipment: item.equipment,
  mode: item.mode,
  district: item.district,
  capacity: item.capacity,
  condition: item.condition,
  description: item.description,
  customerPrice: item.customer_price,
  photoUrl: item.photo_path
    ? supabase.storage
      .from('crane-photos')
      .getPublicUrl(item.photo_path).data.publicUrl
    : ''
})

function App() {
  const [listings, setListings] = useState([])
  const [publicListings, setPublicListings] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [dataLoading, setDataLoading] = useState(true)
  const [busyId, setBusyId] = useState('')

  const [adminView, setAdminView] = useState(false)
  const [adminUser, setAdminUser] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  const [filterMode, setFilterMode] = useState('All')
  const [filterDistrict, setFilterDistrict] = useState('All')
  const [search, setSearch] = useState('')
  const [notice, setNotice] = useState('')

  const [editingId, setEditingId] = useState('')

  // Admin ke liye live database refresh.
  const refreshAdminData = async () => {
    const [
      { data: supplierRows, error: supplierError },
      { data: enquiryRows, error: enquiryError },
      { data: publicRows, error: publicError }
    ] = await Promise.all([
      supabase
        .from('supplier_submissions')
        .select('*')
        .order('created_at', { ascending: false }),

      supabase
        .from('customer_enquiries')
        .select('*')
        .order('created_at', { ascending: false }),

      supabase
        .from('public_cranes')
        .select('*')
        .order('created_at', { ascending: false })
    ])

    if (supplierError) throw supplierError

    setListings((supplierRows || []).map(mapSupplierRow))

    if (enquiryError) {
      console.error('Customer enquiries loading failed:', enquiryError)
    } else {
      setEnquiries((enquiryRows || []).map(mapEnquiryRow))
    }

    if (publicError) {
      console.error('Public listings loading failed:', publicError)
    } else {
      setPublicListings((publicRows || []).map(mapPublicRow))
    }
  }

  // Realtime updates + 10-second refresh.
  useEffect(() => {
    if (!adminUser) return

    let active = true

    const loadLatestData = async () => {
      try {
        await refreshAdminData()
      } catch (error) {
        console.error('Admin refresh failed:', error)

        if (active) {
          setNotice(`Supplier data loading failed: ${error.message}`)
        }
      }
    }

    const channel = supabase
      .channel('craneseva-admin-live-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'supplier_submissions'
        },
        () => loadLatestData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'public_cranes'
        },
        () => loadLatestData()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'customer_enquiries'
        },
        () => loadLatestData()
      )
      .subscribe()

    const interval = window.setInterval(loadLatestData, 10000)

    return () => {
      active = false
      window.clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [adminUser])

  // Authentication aur public listings.
  useEffect(() => {
    let mounted = true

    const loadPublicListings = async () => {
      const { data, error } = await supabase
        .from('public_cranes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map(mapPublicRow)
    }

    const loadData = async (isAdmin) => {
      try {
        try {
          const publicRows = await loadPublicListings()

          if (mounted) setPublicListings(publicRows)
        } catch (error) {
          console.error('Public listings loading failed:', error)
        }

        if (isAdmin) {
          const { data: supplierRows, error: supplierError } =
            await supabase
              .from('supplier_submissions')
              .select('*')
              .order('created_at', { ascending: false })

          if (supplierError) throw supplierError

          if (mounted) {
            setListings((supplierRows || []).map(mapSupplierRow))
          }

          const { data: enquiryRows, error: enquiryError } =
            await supabase
              .from('customer_enquiries')
              .select('*')
              .order('created_at', { ascending: false })

          if (enquiryError) {
            console.error('Enquiries loading failed:', enquiryError)
          } else if (mounted) {
            setEnquiries((enquiryRows || []).map(mapEnquiryRow))
          }
        }
      } catch (error) {
        console.error('CraneSeva data loading failed:', error)

        if (mounted) {
          setNotice(`Database loading error: ${error.message}`)
        }
      } finally {
        if (mounted) setDataLoading(false)
      }
    }

    const checkAdminSession = async () => {
      try {
        const {
          data: { session },
          error
        } = await supabase.auth.getSession()

        if (error) throw error

        if (!session?.user) {
          if (mounted) setAdminUser(null)

          await loadData(false)
          return
        }

        const { data: profile, error: profileError } =
          await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()

        if (profileError || profile?.role !== 'admin') {
          await supabase.auth.signOut()

          if (mounted) setAdminUser(null)

          await loadData(false)
          return
        }

        if (mounted) setAdminUser(session.user)

        await loadData(true)

      } catch (error) {
        console.error('Session check failed:', error)

        if (mounted) {
          setAdminUser(null)
          setNotice(`Could not load account: ${error.message}`)
        }

        await loadData(false)

      } finally {
        if (mounted) setAuthChecked(true)
      }
    }

    checkAdminSession()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT' && mounted) {
        setAdminUser(null)
        setAdminView(false)
        setListings([])
        setEnquiries([])
        setEditingId('')
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleAdminLogin = async (user) => {
    setAdminUser(user)
    setAdminView(true)
    setDataLoading(true)

    try {
      await refreshAdminData()
      setNotice('Welcome to CraneSeva Admin. Live data loaded.')
    } catch (error) {
      setNotice(`Admin data loading failed: ${error.message}`)
    } finally {
      setDataLoading(false)
    }
  }

  const handleAdminLogout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      setNotice(error.message)
      return
    }

    setAdminUser(null)
    setAdminView(false)
    setEditingId('')

    window.scrollTo({ top: 0, behavior: 'smooth' })
    setNotice('Admin logged out successfully.')
  }

  // Supplier details edit.
  const saveSupplierEdit = async (e, id) => {
    e.preventDefault()

    const form = e.currentTarget
    const data = new FormData(form)

    const phone = String(data.get('phone') || '').trim()

    if (!/^[0-9]{10}$/.test(phone)) {
      setNotice('Please enter a valid 10-digit supplier mobile number.')
      return
    }

    const updatedDetails = {
      company: String(data.get('company') || '').trim(),
      owner: String(data.get('owner') || '').trim(),
      phone,
      equipment: String(data.get('equipment') || '').trim(),
      mode: String(data.get('mode') || '').trim(),
      district: String(data.get('district') || '').trim(),
      supplier_price:
        String(data.get('supplierPrice') || '').trim() || null,
      capacity:
        String(data.get('capacity') || '').trim() || null,
      condition:
        String(data.get('condition') || '').trim() || null,
      description:
        String(data.get('description') || '').trim() || null
    }

    setBusyId(id)

    try {
      const { error } = await supabase
        .from('supplier_submissions')
        .update(updatedDetails)
        .eq('id', id)

      if (error) throw error

      await refreshAdminData()

      setEditingId('')
      setNotice('Supplier details updated successfully.')

    } catch (error) {
      console.error('Supplier edit failed:', error)
      setNotice(`Could not update supplier details: ${error.message}`)
    } finally {
      setBusyId('')
    }
  }

  // Supplier public form.
  const saveSupplierLead = async (e) => {
    e.preventDefault()

    const form = e.currentTarget
    const data = new FormData(form)
    const phone = String(data.get('phone') || '').trim()

    if (!/^[0-9]{10}$/.test(phone)) {
      setNotice('Please enter a valid 10-digit mobile number.')
      return
    }

    const lead = {
      company: String(data.get('company') || '').trim(),
      owner: String(data.get('owner') || '').trim(),
      phone,
      equipment: String(data.get('equipment') || ''),
      mode: String(data.get('mode') || ''),
      district: String(data.get('district') || ''),
      supplier_price:
        String(data.get('supplierPrice') || '').trim() || null,
      capacity:
        String(data.get('capacity') || '').trim() || null,
      condition:
        String(data.get('condition') || '').trim() || null,
      description:
        String(data.get('description') || '').trim() || null,
      status: 'pending'
    }

    const { error } = await supabase
      .from('supplier_submissions')
      .insert([lead])

    if (error) {
      console.error(error)
      setNotice(`Submission failed: ${error.message}`)
      return
    }

    form.reset()

    setNotice(
      'Equipment submitted successfully! CraneSeva team will contact you.'
    )
  }

  // Admin price + selected rental unit + original crane photo.
  const publishListing = async (e, id) => {
    e.preventDefault()

    const form = e.currentTarget
    const data = new FormData(form)

    const rawCustomerPrice = String(
      data.get('customerPrice') || ''
    ).trim()

    const priceUnit = String(
      data.get('priceUnit') || 'day'
    )

    const baseCustomerPrice = rawCustomerPrice
      .replace(/\/\s*(day|daily|month|monthly)\s*$/i, '')
      .trim()

    const customerPrice = `${baseCustomerPrice}/${priceUnit}`

    const photo = data.get('photo')

    if (!baseCustomerPrice) {
      return setNotice('Please enter the customer price.')
    }

    if (!/^[₹]?\s*[\d,]+(?:\.\d+)?$/.test(baseCustomerPrice)) {
      return setNotice('Please enter a valid price, for example 30000.')
    }

    if (!['day', 'month'].includes(priceUnit)) {
      return setNotice('Please select Daily or Monthly pricing.')
    }

    if (!(photo instanceof File) || !photo.size) {
      return setNotice(
        'Please upload the real equipment photo before publishing.'
      )
    }

    if (!photo.type.startsWith('image/')) {
      return setNotice('Please select a valid image file.')
    }

    setBusyId(id)

    try {
      const ext = (
        photo.name.split('.').pop() || 'jpg'
      ).toLowerCase().replace(/[^a-z0-9]/g, '')

      const photoPath = `${id}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('crane-photos')
        .upload(photoPath, photo, {
          contentType: photo.type,
          upsert: false
        })

      if (uploadError) throw uploadError

      const item = listings.find(x => x.id === id)

      if (!item) {
        throw new Error(
          'Supplier submission not found. Refresh the dashboard.'
        )
      }

      const { error: publicError } = await supabase
        .from('public_cranes')
        .upsert({
          submission_id: id,
          equipment: item.equipment,
          mode: item.mode,
          district: item.district,
          capacity: item.capacity || null,
          condition: item.condition || null,
          description: item.description || null,
          customer_price: customerPrice,
          photo_path: photoPath
        }, {
          onConflict: 'submission_id'
        })

      if (publicError) throw publicError

      const { error: updateError } = await supabase
        .from('supplier_submissions')
        .update({
          customer_price: customerPrice,
          admin_photo_path: photoPath,
          status: 'published'
        })
        .eq('id', id)

      if (updateError) throw updateError

      await refreshAdminData()

      setNotice(
        'Equipment approved and published on the marketplace.'
      )

    } catch (error) {
      console.error('Publish failed:', error)
      setNotice(`Publish failed: ${error.message}`)

    } finally {
      setBusyId('')
    }
  }

  const unpublishListing = async (id) => {
    if (!window.confirm('Remove this equipment from the public marketplace?')) {
      return
    }

    setBusyId(id)

    try {
      const { error: deleteError } = await supabase
        .from('public_cranes')
        .delete()
        .eq('submission_id', id)

      if (deleteError) throw deleteError

      const { error: updateError } = await supabase
        .from('supplier_submissions')
        .update({ status: 'pending' })
        .eq('id', id)

      if (updateError) throw updateError

      await refreshAdminData()
      setNotice('Equipment removed from public marketplace.')

    } catch (error) {
      setNotice(`Could not unpublish equipment: ${error.message}`)
    } finally {
      setBusyId('')
    }
  }

  const deleteListing = async (id) => {
    if (!window.confirm('Delete this supplier submission permanently?')) {
      return
    }

    setBusyId(id)

    try {
      const { data: publicItem, error: fetchError } = await supabase
        .from('public_cranes')
        .select('photo_path')
        .eq('submission_id', id)
        .maybeSingle()

      if (fetchError) throw fetchError

      const { error: publicError } = await supabase
        .from('public_cranes')
        .delete()
        .eq('submission_id', id)

      if (publicError) throw publicError

      const { error: supplierError } = await supabase
        .from('supplier_submissions')
        .delete()
        .eq('id', id)

      if (supplierError) throw supplierError

      if (publicItem?.photo_path) {
        const { error: storageError } = await supabase.storage
          .from('crane-photos')
          .remove([publicItem.photo_path])

        if (storageError) {
          console.error('Photo cleanup failed:', storageError)
        }
      }

      await refreshAdminData()
      setNotice('Supplier submission deleted.')

    } catch (error) {
      setNotice(`Could not delete submission: ${error.message}`)
    } finally {
      setBusyId('')
    }
  }

  const saveCustomerEnquiry = async (e) => {
    e.preventDefault()

    const form = e.currentTarget
    const data = new FormData(form)

    const phone = String(data.get('customerPhone') || '').trim()

    if (!/^[0-9]{10}$/.test(phone)) {
      setNotice('Please enter a valid 10-digit mobile number.')
      return
    }

    const enquiry = {
      name: String(data.get('name') || '').trim(),
      phone,
      mode: String(data.get('customerMode') || ''),
      equipment: String(data.get('customerEquipment') || ''),
      district: String(data.get('customerDistrict') || ''),
      duration: String(data.get('duration') || '').trim() || null,
      budget: String(data.get('budget') || '').trim() || null,
      details: String(data.get('details') || '').trim() || null
    }

    const { error } = await supabase
      .from('customer_enquiries')
      .insert([enquiry])

    if (error) {
      console.error(error)
      setNotice(`Enquiry could not be saved: ${error.message}`)
      return
    }

    const message = [
      'Hello CraneSeva! I have a new equipment requirement.',
      `Name: ${enquiry.name}`,
      `Mobile: ${enquiry.phone}`,
      `Requirement: ${enquiry.mode}`,
      `Equipment: ${enquiry.equipment}`,
      `Location: ${enquiry.district}, Madhya Pradesh`,
      `Timeline: ${enquiry.duration || 'Not specified'}`,
      `Budget: ${enquiry.budget || 'Not specified'}`,
      `Details: ${enquiry.details || 'Not specified'}`
    ].join('\n')

    form.reset()

    setNotice('Enquiry saved. Opening CraneSeva WhatsApp...')
    sendWhatsApp(message)
  }

  const sendWhatsApp = (message, number = ADMIN_WHATSAPP) => {
    const cleanNumber = String(number).replace(/\D/g, '')

    if (!cleanNumber) {
      setNotice('WhatsApp number is invalid.')
      return
    }

    const url = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const pendingListings = listings.filter(
    item => item.status !== 'published'
  )

  const publishedListings = publicListings

  const filteredListings = publishedListings.filter(item => {
    const matchesMode =
      filterMode === 'All' ||
      item.mode === filterMode ||
      item.mode === 'Both'

    const matchesDistrict =
      filterDistrict === 'All' ||
      item.district === filterDistrict

    const matchesSearch =
      `${item.equipment || ''} ${item.district || ''} ${item.capacity || ''}`
        .toLowerCase()
        .includes(search.toLowerCase())

    return matchesMode && matchesDistrict && matchesSearch
  })

  const selectCategory = (name) => {
    setSearch(name)

    document.getElementById('marketplace')?.scrollIntoView({
      behavior: 'smooth'
    })
  }

  const openSupplierWhatsApp = (item) => {
    const message = [
      `Hello ${item.owner}, this is CraneSeva.`,
      `We received your ${item.equipment} submission.`,
      'Please confirm current availability and your final expected rate.'
    ].join('\n')

    sendWhatsApp(message)
  }

  return (
    <div className="website">

      {/* NAVIGATION */}
      <nav className="navbar">
        <a href="#home" className="logo">
          <span className="logo-symbol">C</span>
          CRANE<span className="logo-yellow">SEVA</span>
          <small>MP</small>
        </a>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#categories">Equipment</a>
          <a href="#marketplace">Marketplace</a>
          <a href="#enquiry">Find a Crane</a>
          <a href="#supplier">For Suppliers</a>
        </div>

        <div className="nav-actions">
          <button
            className="admin-nav"
            onClick={() => {
              setAdminView(value => !value)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          >
            {adminView
              ? '← Website'
              : adminUser
                ? 'Admin Dashboard'
                : 'Admin Login'}
          </button>

          <a href="#enquiry" className="nav-button">
            Get a Quote <span>↗</span>
          </a>
        </div>
      </nav>

      {/* ADMIN SESSION CHECK */}
      {adminView && !authChecked ? (
        <main className="admin-page">
          <div className="admin-header">
            <div className="tag">CRANESEVA CONTROL CENTRE</div>
            <h1>Checking Admin Session<span>.</span></h1>
            <p>Please wait while we verify your secure login.</p>
          </div>
        </main>

      ) : adminView && !adminUser ? (
        <AdminLogin onLogin={handleAdminLogin} />

      ) : adminView ? (

        /* ADMIN DASHBOARD */
        <main className="admin-page">

          <div className="admin-header">
            <div className="tag">CRANESEVA CONTROL CENTRE</div>
            <h1>Admin Dashboard<span>.</span></h1>

            <p>
              Manage supplier submissions, negotiate prices and publish equipment.
            </p>

            <div className="admin-warning">
              LIVE DATABASE MODE — Supplier submissions, customer enquiries
              and published equipment are connected to Supabase.
              Dashboard automatically refreshes every 10 seconds.
            </div>

            <button
              className="outline-action"
              type="button"
              onClick={handleAdminLogout}
            >
              Logout
            </button>
          </div>

          {dataLoading ? (
            <div className="empty-state">
              <h3>Loading live data...</h3>
              <p>Please wait while CraneSeva database is loading.</p>
            </div>
          ) : (
            <>
              <div className="admin-stats">
                <div>
                  <span>Total submissions</span>
                  <strong>{listings.length}</strong>
                </div>

                <div>
                  <span>Pending review</span>
                  <strong>{pendingListings.length}</strong>
                </div>

                <div>
                  <span>Live equipment</span>
                  <strong>{publishedListings.length}</strong>
                </div>

                <div>
                  <span>Customer leads</span>
                  <strong>{enquiries.length}</strong>
                </div>
              </div>

              {/* PENDING SUPPLIER SUBMISSIONS */}
              <section className="admin-section">
                <div className="admin-section-title">
                  <div>
                    <p className="tag">01 / PRIVATE SUPPLIER LEADS</p>
                    <h2>Review & Negotiate</h2>
                  </div>

                  <span className="count-pill">
                    {pendingListings.length} Pending
                  </span>
                </div>

                {pendingListings.length === 0 ? (
                  <div className="empty-state">
                    <h3>No pending submissions</h3>
                    <p>New supplier equipment submissions will appear here.</p>
                  </div>
                ) : (
                  <div className="admin-grid">
                    {pendingListings.map(item => (
                      <article className="admin-card" key={item.id}>

                        <div className="admin-card-top">
                          <span className="listing-tag">PRIVATE LEAD</span>
                          <span className="status-pending">Pending review</span>
                        </div>

                        <h3>{item.equipment}</h3>

                        <p><b>Company:</b> {item.company}</p>
                        <p><b>Contact person:</b> {item.owner}</p>

                        <p>
                          <b>Supplier phone:</b>{' '}
                          <a href={`tel:${item.phone}`}>{item.phone}</a>
                        </p>

                        <p><b>Location:</b> {item.district}, MP</p>
                        <p><b>Supplier rate:</b> {item.supplierPrice || 'Not provided'}</p>
                        <p><b>Service:</b> {item.mode}</p>
                        <p><b>Capacity:</b> {item.capacity || 'Not provided'}</p>
                        <p><b>Condition:</b> {item.condition || 'Not provided'}</p>
                        <p><b>Details:</b> {item.description || 'No details'}</p>

                        <p className="admin-date">
                          Submitted: {item.date}
                        </p>

                        <button
                          className="outline-action"
                          type="button"
                          onClick={() => openSupplierWhatsApp(item)}
                        >
                          Open CraneSeva WhatsApp ↗
                        </button>

                        <button
                          className="outline-action"
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => {
                            setEditingId(
                              editingId === item.id ? '' : item.id
                            )
                          }}
                        >
                          {editingId === item.id
                            ? 'Cancel Edit'
                            : 'Edit Supplier Details'}
                        </button>

                        {editingId === item.id && (
                          <form
                            className="publish-form"
                            onSubmit={e => saveSupplierEdit(e, item.id)}
                          >
                            <h3>Edit Supplier Details</h3>

                            <label>
                              Company / Owner Name
                              <input
                                name="company"
                                defaultValue={item.company || ''}
                                required
                              />
                            </label>

                            <label>
                              Contact Person
                              <input
                                name="owner"
                                defaultValue={item.owner || ''}
                                required
                              />
                            </label>

                            <label>
                              Mobile Number
                              <input
                                name="phone"
                                type="tel"
                                inputMode="numeric"
                                pattern="[0-9]{10}"
                                maxLength="10"
                                defaultValue={item.phone || ''}
                                required
                              />
                            </label>

                            <label>
                              Equipment Type
                              <select
                                name="equipment"
                                defaultValue={item.equipment || ''}
                                required
                              >
                                {equipmentTypes.map(x => (
                                  <option key={x} value={x}>{x}</option>
                                ))}
                              </select>
                            </label>

                            <label>
                              Service Type
                              <select
                                name="mode"
                                defaultValue={item.mode || ''}
                                required
                              >
                                <option value="Rental">Rental</option>
                                <option value="Sale">Sale</option>
                                <option value="Both">Rental + Sale</option>
                              </select>
                            </label>

                            <label>
                              Equipment Location
                              <select
                                name="district"
                                defaultValue={item.district || ''}
                                required
                              >
                                {districts.map(x => (
                                  <option key={x} value={x}>{x}</option>
                                ))}
                              </select>
                            </label>

                            <label>
                              Supplier Rate
                              <input
                                name="supplierPrice"
                                defaultValue={item.supplierPrice || ''}
                                placeholder="e.g. ₹25,000/day"
                              />
                            </label>

                            <label>
                              Capacity / Model
                              <input
                                name="capacity"
                                defaultValue={item.capacity || ''}
                              />
                            </label>

                            <label>
                              Equipment Condition
                              <select
                                name="condition"
                                defaultValue={item.condition || ''}
                              >
                                <option value="">Select condition</option>
                                <option>Brand New</option>
                                <option>Excellent</option>
                                <option>Good</option>
                                <option>Used</option>
                              </select>
                            </label>

                            <label>
                              Machine Details
                              <textarea
                                name="description"
                                rows="3"
                                defaultValue={item.description || ''}
                              />
                            </label>

                            <button
                              className="submit-btn"
                              type="submit"
                              disabled={busyId === item.id}
                            >
                              {busyId === item.id
                                ? 'Saving...'
                                : 'Save Supplier Details'}
                            </button>
                          </form>
                        )}

                        <form
                          className="publish-form"
                          onSubmit={e => publishListing(e, item.id)}
                        >
                          <label>
                            CraneSeva Customer Price *
                            <input
                              name="customerPrice"
                              defaultValue={getPriceWithoutUnit(item.customerPrice)}
                              placeholder="e.g. 30000"
                              inputMode="decimal"
                              required
                            />
                          </label>

                          <label>
                            Rental Pricing Type *
                            <select
                              name="priceUnit"
                              defaultValue={getPriceUnit(item.customerPrice)}
                              required
                            >
                              <option value="day">Daily</option>
                              <option value="month">Monthly</option>
                            </select>
                          </label>

                          <small>
                            Example: ₹30,000/day or ₹2,50,000/month.
                          </small>

                          <label>
                            Upload Real Equipment Photo *
                            <input
                              type="file"
                              name="photo"
                              accept="image/*"
                              required
                            />
                          </label>

                          <button
                            className="submit-btn"
                            type="submit"
                            disabled={busyId === item.id}
                          >
                            {busyId === item.id
                              ? 'Publishing...'
                              : 'Approve & Publish ↗'}
                          </button>
                        </form>

                        <button
                          className="delete-action"
                          type="button"
                          disabled={busyId === item.id}
                          onClick={() => deleteListing(item.id)}
                        >
                          Delete Submission
                        </button>

                      </article>
                    ))}
                  </div>
                )}
              </section>

              {/* PUBLISHED EQUIPMENT */}
              <section className="admin-section">
                <div className="admin-section-title">
                  <div>
                    <p className="tag">02 / PUBLIC MARKETPLACE</p>
                    <h2>Published Equipment</h2>
                  </div>

                  <span className="count-pill">
                    {publishedListings.length} Live
                  </span>
                </div>

                <div className="admin-grid">
                  {publishedListings.map(item => (
                    <article className="admin-card" key={item.publicId}>

                      {item.photoUrl && (
                        <img
                          className="admin-photo"
                          src={item.photoUrl}
                          alt={item.equipment}
                        />
                      )}

                      <span className="status-live">Published</span>

                      <h3>{item.equipment}</h3>

                      <p><b>Location:</b> {item.district}, MP</p>
                      <p>
                        <b>Customer price:</b>{' '}
                        {formatCustomerPrice(item.customerPrice)}
                      </p>

                      <button
                        className="delete-action"
                        type="button"
                        disabled={busyId === item.id}
                        onClick={() => unpublishListing(item.id)}
                      >
                        Unpublish Equipment
                      </button>

                    </article>
                  ))}

                  {publishedListings.length === 0 && (
                    <p className="muted">No equipment published yet.</p>
                  )}
                </div>
              </section>

              {/* CUSTOMER ENQUIRIES */}
              <section className="admin-section">
                <div className="admin-section-title">
                  <div>
                    <p className="tag">03 / CUSTOMER ENQUIRIES</p>
                    <h2>Customer Leads</h2>
                  </div>

                  <span className="count-pill">
                    {enquiries.length} Leads
                  </span>
                </div>

                <div className="admin-grid">
                  {enquiries.map(item => (
                    <article className="admin-card" key={item.id}>

                      <span className="listing-tag">{item.mode}</span>

                      <h3>{item.equipment}</h3>

                      <p><b>Customer:</b> {item.name}</p>

                      <p>
                        <b>Phone:</b>{' '}
                        <a href={`tel:${item.phone}`}>{item.phone}</a>
                      </p>

                      <p><b>Location:</b> {item.district}, MP</p>
                      <p><b>Budget:</b> {item.budget || 'Not provided'}</p>
                      <p><b>Timeline:</b> {item.duration || 'Not specified'}</p>
                      <p><b>Details:</b> {item.details || 'None'}</p>

                      <p className="admin-date">{item.date}</p>

                      <a
                        className="outline-action"
                        href={`https://wa.me/91${item.phone}?text=${encodeURIComponent('Hello, this is CraneSeva regarding your equipment enquiry.')}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Contact Customer ↗
                      </a>

                    </article>
                  ))}

                  {enquiries.length === 0 && (
                    <p className="muted">No customer enquiries yet.</p>
                  )}
                </div>
              </section>
            </>
          )}

        </main>

      ) : (
        /* PUBLIC WEBSITE */
        <>

          {/* HERO */}
          <section className="hero" id="home">
            <div className="hero-shade"></div>

            <div className="hero-content">
              <div className="hero-kicker">
                <span></span> MADHYA PRADESH'S HEAVY EQUIPMENT NETWORK
              </div>

              <h1>
                POWERING<br />
                <span>BIG PROJECTS.</span><br />
                ONE CRANE AT A TIME.
              </h1>

              <p className="description">
                Find the right crane and construction machinery for your next project.
                Discover equipment for rental and purchase through CraneSeva.
              </p>

              <div className="hero-buttons">
                <a href="#marketplace" className="primary-btn">
                  Explore Equipment <span>↗</span>
                </a>

                <a href="#enquiry" className="secondary-btn">
                  Request a Quote <span>→</span>
                </a>
              </div>

              <div className="hero-proof">
                <div>
                  <strong>RENT</strong>
                  <small>Equipment hire</small>
                </div>

                <div>
                  <strong>BUY</strong>
                  <small>Machinery purchase</small>
                </div>

                <div>
                  <strong>SELL</strong>
                  <small>Supplier network</small>
                </div>
              </div>
            </div>

            <div className="hero-caption">
              <span className="caption-line"></span>
              BUILT FOR THE BIG JOBS
            </div>

            <div className="hero-scroll">SCROLL TO EXPLORE ↓</div>
          </section>

          <section className="trust-strip">
            <span>HEAVY CRANES</span><i>✦</i>
            <span>CONSTRUCTION EQUIPMENT</span><i>✦</i>
            <span>RENTAL & SALES</span><i>✦</i>
            <span>MADE FOR MADHYA PRADESH</span>
          </section>

          {/* CATEGORIES */}
          <section className="categories-section" id="categories">
            <div className="section-heading section-heading-row">
              <div>
                <p className="tag">01 / EQUIPMENT CATEGORIES</p>
                <h2>
                  THE RIGHT MACHINE.<br />
                  <span>THE RIGHT MISSION.</span>
                </h2>
              </div>

              <p>
                From precision lifting to heavy-duty construction,
                explore machinery categories available through CraneSeva.
              </p>
            </div>

            <div className="category-grid">
              {categories.map((item, index) => (
                <button
                  className="category-card"
                  key={item.name}
                  onClick={() => selectCategory(item.name)}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="category-photo"
                    loading="lazy"
                    onError={e => {
                      e.currentTarget.style.display = 'none'
                    }}
                  />

                  <div className="category-overlay"></div>

                  <span className="category-number">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  <div className="category-copy">
                    <h3>{item.name}</h3>
                    <p>{item.detail}</p>
                  </div>

                  <span className="category-arrow">↗</span>
                </button>
              ))}
            </div>
          </section>

          {/* MARKETPLACE */}
          <section className="market-section" id="marketplace">
            <div className="section-heading section-heading-row">
              <div>
                <p className="tag">02 / CRANESEVA MARKETPLACE</p>
                <h2>FEATURED <span>EQUIPMENT.</span></h2>
              </div>

              <p>
                Every listing is reviewed by the CraneSeva team.
                Supplier contact details and original rates stay private.
              </p>
            </div>

            <div className="filters">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search crane, capacity or equipment..."
              />

              <select
                value={filterMode}
                onChange={e => setFilterMode(e.target.value)}
              >
                <option value="All">All Services</option>
                <option value="Rental">For Rent</option>
                <option value="Sale">For Sale</option>
              </select>

              <select
                value={filterDistrict}
                onChange={e => setFilterDistrict(e.target.value)}
              >
                <option value="All">All MP Locations</option>
                {districts.map(d => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </div>

            {dataLoading && (
              <p className="muted">Loading approved equipment...</p>
            )}

            <div className="listing-grid">
              {filteredListings.length === 0 ? (
                <div className="empty-state">
                  <h3>Equipment is being onboarded.</h3>

                  <p>
                    Tell us what you need. Our team will coordinate with
                    equipment owners and get back to you.
                  </p>

                  <a href="#enquiry" className="primary-btn">
                    Request Equipment ↗
                  </a>
                </div>
              ) : (
                filteredListings.map(item => {
                  const category = categories.find(
                    c => c.name === item.equipment
                  )

                  return (
                    <article className="listing-card" key={item.id}>
                      <div className="listing-visual">
                        {(item.photoUrl || category?.image) && (
                          <img
                            src={item.photoUrl || category?.image}
                            alt={item.equipment}
                            onError={e => {
                              e.currentTarget.style.display = 'none'
                            }}
                          />
                        )}

                        <div className="listing-visual-shade"></div>

                        <span className="approved-label">
                          ✓ CRANESEVA APPROVED
                        </span>
                      </div>

                      <div className="listing-info">
                        <span className="listing-tag">
                          {item.mode === 'Both'
                            ? 'RENT + SALE'
                            : item.mode === 'Rental'
                              ? 'FOR RENT'
                              : 'FOR SALE'}
                        </span>

                        <h3>{item.equipment}</h3>

                        <p className="listing-location">
                          {item.district}, Madhya Pradesh
                        </p>

                        {item.capacity && <p>{item.capacity}</p>}

                        {item.condition && (
                          <p>Condition: {item.condition}</p>
                        )}

                        <strong className="price">
                          {formatCustomerPrice(item.customerPrice)}
                        </strong>

                        <a
                          className="listing-contact"
                          href={`https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(
                            `Hello CraneSeva, I am interested in your ${item.equipment} listing in ${item.district}. Please share availability and details.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Enquire with CraneSeva <span>↗</span>
                        </a>
                      </div>
                    </article>
                  )
                })
              )}
            </div>
          </section>

          {/* PROCESS */}
          <section className="process-section">
            <div className="section-heading">
              <p className="tag">03 / SIMPLE PROCESS</p>

              <h2>
                FROM REQUIREMENT<br />
                <span>TO REAL EQUIPMENT.</span>
              </h2>
            </div>

            <div className="process-grid">
              <div>
                <b>01</b>
                <h3>Tell Us Your Need</h3>
                <p>Share your equipment type, location and project timeline.</p>
              </div>

              <div>
                <b>02</b>
                <h3>We Find the Match</h3>
                <p>Our team coordinates with equipment owners and checks availability.</p>
              </div>

              <div>
                <b>03</b>
                <h3>Get Your Quote</h3>
                <p>Receive pricing and details from the CraneSeva team.</p>
              </div>

              <div>
                <b>04</b>
                <h3>Move Your Project</h3>
                <p>Coordinate your equipment booking and get started.</p>
              </div>
            </div>
          </section>

          {/* CUSTOMER ENQUIRY */}
          <section className="enquiry-section" id="enquiry">
            <div className="enquiry-copy">
              <p className="tag">04 / CUSTOMER ENQUIRY</p>

              <h2>
                YOUR PROJECT.<br />
                <span>OUR EQUIPMENT.</span>
              </h2>

              <p>
                Tell us what your project needs. Our team will check
                equipment availability and discuss the best available quote.
              </p>

              <div className="enquiry-points">
                <span>✓ Rental and purchase requirements</span>
                <span>✓ Multiple equipment categories</span>
                <span>✓ Madhya Pradesh coverage</span>
                <span>✓ One point of contact: CraneSeva</span>
              </div>

              <div className="contact-number">
                <small>CALL / WHATSAPP</small>
                <strong>+91 88893 67711</strong>
              </div>
            </div>

            <form className="main-form" onSubmit={saveCustomerEnquiry}>
              <div className="form-top">
                <span className="form-icon">↗</span>

                <div>
                  <h3>Request Equipment</h3>
                  <p>Tell us about your requirement.</p>
                </div>
              </div>

              <div className="form-grid">
                <label>
                  Full Name *
                  <input name="name" placeholder="Your name" required />
                </label>

                <label>
                  Mobile Number *
                  <input
                    name="customerPhone"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]{10}"
                    maxLength="10"
                    placeholder="10 digit number"
                    required
                  />
                </label>

                <label>
                  Requirement *
                  <select name="customerMode" required defaultValue="">
                    <option value="" disabled>Select requirement</option>
                    <option value="Rental">Rent Equipment</option>
                    <option value="Sale">Buy Equipment</option>
                  </select>
                </label>

                <label>
                  Equipment Type *
                  <select name="customerEquipment" required defaultValue="">
                    <option value="" disabled>Select equipment</option>
                    {equipmentTypes.map(x => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Project Location *
                  <select name="customerDistrict" required defaultValue="">
                    <option value="" disabled>Select location</option>
                    {districts.map(x => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Required Timeline
                  <select name="duration" defaultValue="">
                    <option value="">Select timeline</option>
                    <option>Immediately</option>
                    <option>Within 7 days</option>
                    <option>Within 1 month</option>
                    <option>2-3 months</option>
                    <option>More than 3 months</option>
                  </select>
                </label>

                <label className="full-width">
                  Approximate Budget
                  <input
                    name="budget"
                    placeholder="Your approximate budget in ₹"
                  />
                </label>

                <label className="full-width">
                  Project Details
                  <textarea
                    name="details"
                    rows="3"
                    placeholder="Capacity, lifting height, machine model, project details..."
                  />
                </label>
              </div>

              <button className="submit-btn" type="submit">
                Send Enquiry on WhatsApp <span>↗</span>
              </button>

              <small className="privacy-note">
                Your enquiry goes to CraneSeva, not directly to a supplier.
              </small>
            </form>
          </section>

          {/* PUBLIC SUPPLIER SUBMISSION */}
          <section className="supplier-section" id="supplier">
            <div className="supplier-inner">

              <div className="supplier-copy">
                <p className="tag">05 / EQUIPMENT OWNERS</p>

                <h2>
                  HAVE A CRANE?<br />
                  <span>LET'S PUT IT TO WORK.</span>
                </h2>

                <p>
                  Share your equipment details with CraneSeva.
                  No account or login is required. Our team will contact you,
                  discuss your expected rate and manage the customer listing.
                </p>

                <a href="#supplier-form" className="supplier-login-button">
                  List Your Crane →
                </a>

                <ul>
                  <li>No supplier login or registration required</li>
                  <li>Submit multiple cranes separately</li>
                  <li>Rate discussion with our team</li>
                  <li>CraneSeva-managed customer enquiries</li>
                  <li>Your number is not shown publicly</li>
                </ul>
              </div>

              <form
                id="supplier-form"
                className="main-form supplier-form"
                onSubmit={saveSupplierLead}
              >
                <div className="form-top">
                  <span className="form-icon">＋</span>

                  <div>
                    <h3>Submit Your Equipment</h3>
                    <p>Public supplier equipment submission form.</p>
                  </div>
                </div>

                <div className="form-grid">
                  <label>
                    Company / Owner Name *
                    <input name="company" placeholder="Business name" required />
                  </label>

                  <label>
                    Contact Person *
                    <input name="owner" placeholder="Full name" required />
                  </label>

                  <label>
                    Mobile Number *
                    <input
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      pattern="[0-9]{10}"
                      maxLength="10"
                      placeholder="10 digit number"
                      required
                    />
                  </label>

                  <label>
                    Equipment Type *
                    <select name="equipment" required defaultValue="">
                      <option value="" disabled>Select equipment</option>
                      {equipmentTypes.map(x => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Service Type *
                    <select name="mode" required defaultValue="">
                      <option value="" disabled>Select service</option>
                      <option value="Rental">Rental</option>
                      <option value="Sale">Sale</option>
                      <option value="Both">Rental + Sale</option>
                    </select>
                  </label>

                  <label>
                    Equipment Location *
                    <select name="district" required defaultValue="">
                      <option value="" disabled>Select district</option>
                      {districts.map(x => (
                        <option key={x}>{x}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Expected Supplier Rate
                    <input
                      name="supplierPrice"
                      placeholder="e.g. ₹25,000 per day"
                    />
                  </label>

                  <label>
                    Capacity / Model
                    <input
                      name="capacity"
                      placeholder="e.g. 25 Ton / 2022 Model"
                    />
                  </label>

                  <label>
                    Equipment Condition
                    <select name="condition" defaultValue="">
                      <option value="">Select condition</option>
                      <option>Brand New</option>
                      <option>Excellent</option>
                      <option>Good</option>
                      <option>Used</option>
                    </select>
                  </label>

                  <label className="full-width">
                    Machine Details
                    <textarea
                      name="description"
                      rows="3"
                      placeholder="Availability, specifications, working condition..."
                    />
                  </label>
                </div>

                <button className="submit-btn" type="submit">
                  Submit Equipment Details <span>↗</span>
                </button>

                <small className="privacy-note">
                  Your details are submitted privately for CraneSeva admin review.
                </small>
              </form>
            </div>
          </section>

          {/* CONTACT BANNER */}
          <section className="contact-banner">
            <p className="tag">CRANESEVA • MADHYA PRADESH</p>

            <h2>
              THE RIGHT EQUIPMENT.<br />
              <span>THE RIGHT CONNECTION.</span>
            </h2>

            <a href="#enquiry" className="primary-btn">
              Start Your Enquiry <span>↗</span>
            </a>
          </section>

          {/* FOOTER */}
          <footer>
            <div className="logo footer-logo">
              <span className="logo-symbol">C</span>
              CRANE<span className="logo-yellow">SEVA</span>
              <small>MP</small>
            </div>

            <p>Heavy Equipment Rental & Sales Network</p>
            <p>Serving Madhya Pradesh, India</p>

            <a
              href={`https://wa.me/${ADMIN_WHATSAPP}`}
              target="_blank"
              rel="noreferrer"
            >
              WhatsApp: +91 88893 67711
            </a>

            <p>© 2026 CraneSeva. All Rights Reserved.</p>
          </footer>

        </>
      )}

      {/* FLOATING WHATSAPP BUTTON */}
      {!adminView && (
        <a
          className="craneseva-whatsapp-float"
          href={`https://wa.me/${ADMIN_WHATSAPP}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Chat with CraneSeva on WhatsApp"
          title="WhatsApp"
        >
          <svg
            viewBox="0 0 32 32"
            width="27"
            height="27"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M16 .5C7.45.5.5 7.45.5 16c0 2.73.72 5.4 2.08 7.75L.4 31.6l8.05-2.11A15.4 15.4 0 0 0 16 31.5c8.55 0 15.5-6.95 15.5-15.5S24.55.5 16 .5Zm0 28.3c-2.42 0-4.8-.65-6.86-1.9l-.49-.3-4.78 1.25 1.28-4.66-.32-.5A12.8 12.8 0 1 1 16 28.8Zm7.02-9.58c-.38-.19-2.22-1.1-2.57-1.23-.35-.13-.6-.19-.85.19-.25.38-.97 1.23-1.19 1.48-.22.25-.44.28-.82.09-.38-.19-1.6-.59-3.05-1.89-1.13-1.01-1.9-2.26-2.12-2.64-.22-.38-.02-.58.17-.77.17-.17.38-.44.57-.66.19-.22.25-.38.38-.63.13-.25.06-.47-.03-.66-.1-.19-.85-2.04-1.16-2.79-.3-.73-.61-.63-.85-.64h-.72c-.25 0-.66.09-1.01.47-.35.38-1.32 1.29-1.32 3.14s1.35 3.65 1.54 3.9c.19.25 2.65 4.05 6.42 5.68.9.39 1.6.62 2.15.79.9.29 1.72.25 2.37.15.72-.11 2.22-.91 2.53-1.79.31-.88.31-1.63.22-1.79-.09-.16-.34-.25-.72-.44Z" />
          </svg>

          <span>WhatsApp</span>
        </a>
      )}

      {/* NOTIFICATION */}
      {notice && (
        <div className="toast" role="status">
          <span>{notice}</span>

          <button
            type="button"
            aria-label="Close notification"
            onClick={() => setNotice('')}
          >
            ×
          </button>
        </div>
      )}

    </div>
  )
}

export default App
