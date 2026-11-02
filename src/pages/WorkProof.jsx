import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase, isConfigured } from '../lib/supabase';

export default function WorkProof() {
  const { cardId } = useParams();
  const navigate = useNavigate();

  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Selected file and caption for new upload
  const [fileToUpload, setFileToUpload] = useState(null);
  const [filePreview, setFilePreview] = useState('');
  const [caption, setCaption] = useState('');

  // Load photos on mount
  useEffect(() => {
    fetchPhotos();
  }, [cardId]);

  const fetchPhotos = async () => {
    if (!cardId) return;
    if (!isConfigured) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      // Ensure session is restored before query
      await supabase.auth.getSession();

      const { data, error } = await supabase
        .from('work_photos')
        .select('*')
        .eq('card_id', cardId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Map to public URLs
      const mapped = (data || []).map((p) => {
        const { data: urlData } = supabase.storage
          .from('work-photos')
          .getPublicUrl(p.file_path);
        return {
          ...p,
          publicUrl: urlData?.publicUrl || ''
        };
      });

      setPhotos(mapped);
    } catch (err) {
      console.error('Error fetching work photos:', err);
      setErrorMessage('Could not load your existing work photos. Please refresh to try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a photo (JPG, PNG, or WebP).');
      return;
    }

    // Limit to 8MB
    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Please pick a photo under 8MB.');
      return;
    }

    setErrorMessage('');
    setFileToUpload(file);
    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);
  };

  const handleUploadPhoto = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!fileToUpload) {
      setErrorMessage('Please select a photo of your work first.');
      return;
    }

    if (photos.length >= 3) {
      setErrorMessage('You can add up to 3 work photos. You can remove one to add a new photo.');
      return;
    }

    if (!isConfigured) {
      setErrorMessage('Supabase is not configured. Add your keys to .env.local to upload photos.');
      return;
    }

    try {
      setUploading(true);

      // Check both local session and auth user for resilience on refresh
      let { data: sessionData } = await supabase.auth.getSession();
      let userId = sessionData?.session?.user?.id;

      if (!userId) {
        const { data: authData } = await supabase.auth.getUser();
        userId = authData?.user?.id;
      }

      if (!userId) {
        throw new Error('Your worker session was not found on this device. Please open your card from My Card to refresh your session.');
      }

      // Generate random file name under auth.uid()/
      const fileExt = fileToUpload.name.split('.').pop() || 'jpg';
      const randomStr = Math.random().toString(36).substring(2, 9);
      const filePath = `${userId}/${Date.now()}-${randomStr}.${fileExt}`;

      // Upload file to 'work-photos' bucket
      const { error: uploadError } = await supabase.storage
        .from('work-photos')
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}. Make sure the 'work-photos' bucket exists and is public in Supabase.`);
      }

      // Insert row into work_photos table
      const { error: insertError } = await supabase
        .from('work_photos')
        .insert({
          card_id: cardId,
          user_id: userId,
          file_path: filePath,
          caption: caption.trim() || 'Work photo'
        });

      if (insertError) {
        // Rollback uploaded file if DB insert failed
        await supabase.storage.from('work-photos').remove([filePath]);
        throw insertError;
      }

      setSuccessMessage('Photo added successfully!');
      setFileToUpload(null);
      setFilePreview('');
      setCaption('');

      // Refresh photo list
      await fetchPhotos();
    } catch (err) {
      console.error('Error adding work photo:', err);
      setErrorMessage(err.message || 'Could not upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photo) => {
    if (!window.confirm('Do you want to remove this work photo?')) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Delete from table
      const { error: dbError } = await supabase
        .from('work_photos')
        .delete()
        .eq('id', photo.id);

      if (dbError) throw dbError;

      // Delete from storage
      await supabase.storage.from('work-photos').remove([photo.file_path]);

      setPhotos(photos.filter(p => p.id !== photo.id));
      setSuccessMessage('Photo removed.');
    } catch (err) {
      console.error('Error deleting photo:', err);
      setErrorMessage(err.message || 'Could not remove photo. Please try again.');
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
          Add work proof
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Real work photos build instant trust. Add up to 3 photos of jobs you have done.
        </p>
      </div>

      {/* Messages */}
      {errorMessage && (
        <div className="banner banner-error" role="alert">
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>{errorMessage}</div>
        </div>
      )}

      {successMessage && (
        <div className="banner banner-success" role="status">
          <span style={{ fontSize: '1.2rem' }}>✓</span>
          <div style={{ flex: 1 }}>{successMessage}</div>
        </div>
      )}

      {/* Upload Slot / Form */}
      {photos.length < 3 ? (
        <div className="card-box">
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '0.5rem' }}>
            Add photo {photos.length + 1} of 3
          </h2>

          <form onSubmit={handleUploadPhoto}>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="photo-file-input" className="form-label">
                Choose a photo from your phone or computer
              </label>
              <input
                id="photo-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="form-input"
                style={{ padding: '0.5rem', cursor: 'pointer' }}
              />
            </div>

            {filePreview && (
              <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
                <img
                  src={filePreview}
                  alt="Work preview"
                  style={{
                    maxHeight: '220px',
                    maxWidth: '100%',
                    borderRadius: 'var(--radius-md)',
                    objectFit: 'contain',
                    border: '1px solid var(--border-color)',
                    backgroundColor: 'var(--bg-subtle)'
                  }}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="caption-input" className="form-label">
                Short caption (what is in this photo?)
              </label>
              <input
                id="caption-input"
                type="text"
                className="form-input"
                placeholder="e.g. 3BHK copper piping setup or Fixed water pump motor"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={80}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={!fileToUpload || uploading}
              style={{ width: '100%' }}
            >
              {uploading ? (
                <>
                  <span className="spinner"></span>
                  <span>Uploading photo...</span>
                </>
              ) : (
                <>
                  <span>📸</span>
                  <span>Upload this work photo</span>
                </>
              )}
            </button>
          </form>
        </div>
      ) : (
        <div className="banner banner-info" style={{ marginBottom: '1.5rem' }}>
          <span>ℹ️</span>
          <span>You have reached the maximum of 3 work photos. You can view your card or remove a photo below.</span>
        </div>
      )}

      {/* Existing Photos List */}
      <div className="card-box">
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem' }}>
          Your work photos ({photos.length}/3)
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '0.75rem', color: 'var(--text-muted)' }}>Loading photos...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="state-box">
            <span className="state-icon">📷</span>
            <p className="state-title">No photos added yet</p>
            <p className="state-desc">
              Photos make your skill card 3x more likely to get work calls.
            </p>
          </div>
        ) : (
          <div className="photo-slots-grid">
            {photos.map((p, idx) => (
              <div key={p.id} className="photo-slot">
                <img
                  src={p.publicUrl}
                  alt={p.caption || `Work sample ${idx + 1}`}
                  className="photo-slot-preview"
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150"><rect width="200" height="150" fill="%23ddd"/><text x="50%" y="50%" fill="%23666" text-anchor="middle">Photo</text></svg>';
                  }}
                />
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)', flex: 1 }}>
                  {p.caption || 'No caption'}
                </p>
                <button
                  type="button"
                  onClick={() => handleDeletePhoto(p)}
                  className="btn btn-danger-soft btn-sm"
                  style={{ alignSelf: 'flex-start' }}
                >
                  <span>🗑️</span>
                  <span>Remove photo</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Next step: View My Card */}
      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
        <button
          type="button"
          onClick={() => navigate('/my-card')}
          className="btn btn-primary"
          style={{ flex: 1, minHeight: '52px', fontSize: '1.1rem' }}
        >
          <span>See my card</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}
