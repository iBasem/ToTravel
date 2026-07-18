export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_activity_logs: {
        Row: {
          action_description: string
          action_type: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string | null
          user_name: string
        }
        Insert: {
          action_description: string
          action_type: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
          user_name: string
        }
        Update: {
          action_description?: string
          action_type?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
          user_name?: string
        }
        Relationships: []
      }
      admin_pending_actions: {
        Row: {
          action_type: string
          assigned_to: string | null
          created_at: string
          description: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          priority: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          action_type: string
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      agency_payouts: {
        Row: {
          agency_id: string
          amount: number
          commission_rate: number
          created_at: string
          id: string
          payment_reference: string | null
          period_end: string
          period_start: string
          processed_at: string | null
          processed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          payment_reference?: string | null
          period_end: string
          period_start: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          amount?: number
          commission_rate?: number
          created_at?: string
          id?: string
          payment_reference?: string | null
          period_end?: string
          period_start?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agency_payouts_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "travel_agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      content_pages: {
        Row: {
          author_id: string | null
          content: string | null
          content_type: string
          created_at: string
          id: string
          slug: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          content?: string | null
          content_type?: string
          created_at?: string
          id?: string
          slug?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          content?: string | null
          content_type?: string
          created_at?: string
          id?: string
          slug?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          agency_id: string
          approval_status: string
          rejection_reason: string | null
          created_at: string
          discount_percentage: number
          end_date: string
          id: string
          package_id: string | null
          start_date: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          agency_id: string
          approval_status?: string
          rejection_reason?: string | null
          created_at?: string
          discount_percentage: number
          end_date: string
          id?: string
          package_id?: string | null
          start_date: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          agency_id?: string
          approval_status?: string
          rejection_reason?: string | null
          created_at?: string
          discount_percentage?: number
          end_date?: string
          id?: string
          package_id?: string | null
          start_date?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "travel_agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      destinations: {
        Row: {
          color_class: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          display_order: number
          featured: boolean
          highlights: string[]
          highlights_ar: string[]
          id: string
          image_url: string | null
          kind: string
          name: string
          name_ar: string | null
          region_keys: string[]
          region_label: string | null
          region_label_ar: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          color_class?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          display_order?: number
          featured?: boolean
          highlights?: string[]
          highlights_ar?: string[]
          id?: string
          image_url?: string | null
          kind?: string
          name: string
          name_ar?: string | null
          region_keys?: string[]
          region_label?: string | null
          region_label_ar?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          color_class?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          display_order?: number
          featured?: boolean
          highlights?: string[]
          highlights_ar?: string[]
          id?: string
          image_url?: string | null
          kind?: string
          name?: string
          name_ar?: string | null
          region_keys?: string[]
          region_label?: string | null
          region_label_ar?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      itineraries: {
        Row: {
          accommodation: string | null
          activities: string[] | null
          activities_ar: string[] | null
          created_at: string
          day_number: number
          description: string | null
          description_ar: string | null
          id: string
          meals_included: string[] | null
          package_id: string
          title: string
          title_ar: string | null
          transportation: string | null
          updated_at: string
        }
        Insert: {
          accommodation?: string | null
          activities?: string[] | null
          activities_ar?: string[] | null
          created_at?: string
          day_number: number
          description?: string | null
          description_ar?: string | null
          id?: string
          meals_included?: string[] | null
          package_id: string
          title: string
          title_ar?: string | null
          transportation?: string | null
          updated_at?: string
        }
        Update: {
          accommodation?: string | null
          activities?: string[] | null
          activities_ar?: string[] | null
          created_at?: string
          day_number?: number
          description?: string | null
          description_ar?: string | null
          id?: string
          meals_included?: string[] | null
          package_id?: string
          title?: string
          title_ar?: string | null
          transportation?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "itineraries_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      agency_activity_logs: {
        Row: {
          id: string
          agency_id: string
          action_type: string
          action_description: string
          entity_type: string | null
          entity_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          agency_id: string
          action_type: string
          action_description: string
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          agency_id?: string
          action_type?: string
          action_description?: string
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: []
      }
      client_errors: {
        Row: {
          id: string
          user_id: string | null
          message: string
          stack: string | null
          path: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          message: string
          stack?: string | null
          path?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          message?: string
          stack?: string | null
          path?: string | null
          created_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      package_hotels: {
        Row: {
          created_at: string
          day_numbers: number[]
          display_order: number
          id: string
          image_path: string | null
          kind: string
          name: string
          name_ar: string | null
          package_id: string
          room_type: string | null
          room_type_ar: string | null
          star_rating: number | null
          updated_at: string
          upgrade_available: boolean
        }
        Insert: {
          created_at?: string
          day_numbers?: number[]
          display_order?: number
          id?: string
          image_path?: string | null
          kind?: string
          name: string
          name_ar?: string | null
          package_id: string
          room_type?: string | null
          room_type_ar?: string | null
          star_rating?: number | null
          updated_at?: string
          upgrade_available?: boolean
        }
        Update: {
          created_at?: string
          day_numbers?: number[]
          display_order?: number
          id?: string
          image_path?: string | null
          kind?: string
          name?: string
          name_ar?: string | null
          package_id?: string
          room_type?: string | null
          room_type_ar?: string | null
          star_rating?: number | null
          updated_at?: string
          upgrade_available?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "package_hotels_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title_key: string
          body_params: Json
          entity_type: string | null
          entity_id: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title_key: string
          body_params?: Json
          entity_type?: string | null
          entity_id?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title_key?: string
          body_params?: Json
          entity_type?: string | null
          entity_id?: string | null
          read_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      package_addons: {
        Row: {
          created_at: string
          display_order: number
          id: string
          name: string
          name_ar: string | null
          package_id: string
          per_person: boolean
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          name: string
          name_ar?: string | null
          package_id: string
          per_person?: boolean
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          name?: string
          name_ar?: string | null
          package_id?: string
          per_person?: boolean
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_addons_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      package_bookings: {
        Row: {
          addons: Json
          booking_date: string
          created_at: string
          departure_id: string | null
          id: string
          package_id: string
          participants: number
          payment_method: string | null
          payment_reference: string | null
          payment_status: string | null
          special_requests: string | null
          cancellation_reason: string | null
          status: string | null
          total_price: number
          traveler_id: string
          updated_at: string
        }
        Insert: {
          addons?: Json
          booking_date: string
          created_at?: string
          departure_id?: string | null
          id?: string
          package_id: string
          participants?: number
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          special_requests?: string | null
          cancellation_reason?: string | null
          status?: string | null
          total_price: number
          traveler_id: string
          updated_at?: string
        }
        Update: {
          addons?: Json
          booking_date?: string
          created_at?: string
          departure_id?: string | null
          id?: string
          package_id?: string
          participants?: number
          payment_method?: string | null
          payment_reference?: string | null
          payment_status?: string | null
          special_requests?: string | null
          cancellation_reason?: string | null
          status?: string | null
          total_price?: number
          traveler_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_bookings_departure_id_fkey"
            columns: ["departure_id"]
            isOneToOne: false
            referencedRelation: "package_departures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_bookings_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "travelers"
            referencedColumns: ["id"]
          },
        ]
      }
      package_departures: {
        Row: {
          created_at: string
          departure_date: string
          id: string
          package_id: string
          price_override: number | null
          return_date: string | null
          status: string
          total_seats: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          departure_date: string
          id?: string
          package_id: string
          price_override?: number | null
          return_date?: string | null
          status?: string
          total_seats?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          departure_date?: string
          id?: string
          package_id?: string
          price_override?: number | null
          return_date?: string | null
          status?: string
          total_seats?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_departures_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      package_media: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number | null
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          is_primary: boolean | null
          media_type: string | null
          mime_type: string | null
          package_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          is_primary?: boolean | null
          media_type?: string | null
          mime_type?: string | null
          package_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_primary?: boolean | null
          media_type?: string | null
          mime_type?: string | null
          package_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_media_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      package_routes: {
        Row: {
          created_at: string
          days_spent: number | null
          destination_order: number
          destination_type: string
          id: string
          latitude: number
          longitude: number
          name: string
          name_ar: string | null
          package_id: string
          place_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          days_spent?: number | null
          destination_order?: number
          destination_type?: string
          id?: string
          latitude: number
          longitude: number
          name: string
          name_ar?: string | null
          package_id: string
          place_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          days_spent?: number | null
          destination_order?: number
          destination_type?: string
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          name_ar?: string | null
          package_id?: string
          place_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_routes_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          agency_id: string
          available_from: string | null
          available_to: string | null
          average_rating: number | null
          base_price: number
          cancellation_policy: string | null
          category: string | null
          created_at: string
          description: string | null
          description_ar: string | null
          destination: string
          destination_ar: string | null
          difficulty_level: string | null
          duration_days: number
          duration_nights: number
          exclusions: string[] | null
          exclusions_ar: string[] | null
          featured: boolean | null
          flight_option: string
          highlights: string[]
          id: string
          inclusions: string[] | null
          inclusions_ar: string[] | null
          max_participants: number | null
          package_type: string
          requirements: string[] | null
          status: string | null
          terms_conditions: string | null
          title: string
          title_ar: string | null
          total_reviews: number | null
          updated_at: string
        }
        Insert: {
          agency_id: string
          available_from?: string | null
          available_to?: string | null
          average_rating?: number | null
          base_price?: number
          cancellation_policy?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          destination: string
          destination_ar?: string | null
          difficulty_level?: string | null
          duration_days?: number
          duration_nights?: number
          exclusions?: string[] | null
          exclusions_ar?: string[] | null
          featured?: boolean | null
          flight_option?: string
          highlights?: string[]
          id?: string
          inclusions?: string[] | null
          inclusions_ar?: string[] | null
          max_participants?: number | null
          package_type?: string
          requirements?: string[] | null
          status?: string | null
          terms_conditions?: string | null
          title: string
          title_ar?: string | null
          total_reviews?: number | null
          updated_at?: string
        }
        Update: {
          agency_id?: string
          available_from?: string | null
          available_to?: string | null
          average_rating?: number | null
          base_price?: number
          cancellation_policy?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          description_ar?: string | null
          destination?: string
          destination_ar?: string | null
          difficulty_level?: string | null
          duration_days?: number
          duration_nights?: number
          exclusions?: string[] | null
          exclusions_ar?: string[] | null
          featured?: boolean | null
          flight_option?: string
          highlights?: string[]
          id?: string
          inclusions?: string[] | null
          inclusions_ar?: string[] | null
          max_participants?: number | null
          package_type?: string
          requirements?: string[] | null
          status?: string | null
          terms_conditions?: string | null
          title?: string
          title_ar?: string | null
          total_reviews?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "packages_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "travel_agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          provider: string
          provider_invoice_id: string | null
          provider_payment_id: string | null
          raw: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          provider?: string
          provider_invoice_id?: string | null
          provider_payment_id?: string | null
          raw?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          provider?: string
          provider_invoice_id?: string | null
          provider_payment_id?: string | null
          raw?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "package_bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          auto_approve_agencies: boolean
          demo_mode: boolean
          commission_rate: number
          email_notifications: boolean
          id: number
          maintenance_mode: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auto_approve_agencies?: boolean
          demo_mode?: boolean
          commission_rate?: number
          email_notifications?: boolean
          id?: number
          maintenance_mode?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auto_approve_agencies?: boolean
          demo_mode?: boolean
          commission_rate?: number
          email_notifications?: boolean
          id?: number
          maintenance_mode?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      platform_stats: {
        Row: {
          active_packages: number
          created_at: string
          id: string
          new_agencies: number
          new_travelers: number
          stat_date: string
          total_bookings: number
          total_revenue: number
        }
        Insert: {
          active_packages?: number
          created_at?: string
          id?: string
          new_agencies?: number
          new_travelers?: number
          stat_date: string
          total_bookings?: number
          total_revenue?: number
        }
        Update: {
          active_packages?: number
          created_at?: string
          id?: string
          new_agencies?: number
          new_travelers?: number
          stat_date?: string
          total_bookings?: number
          total_revenue?: number
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          id: string
          package_id: string
          rating: number
          traveler_id: string
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          id?: string
          package_id: string
          rating: number
          traveler_id: string
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          package_id?: string
          rating?: number
          traveler_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "package_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "travelers"
            referencedColumns: ["id"]
          },
        ]
      }
      travel_agencies: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          commission_rate: number | null
          company_description: string | null
          company_name: string
          contact_person_first_name: string
          contact_person_last_name: string
          country: string | null
          created_at: string
          default_cancellation_policy: string | null
          default_terms_conditions: string | null
          email: string
          id: string
          is_verified: boolean | null
          license_number: string | null
          phone: string | null
          rating: number | null
          status: string
          total_reviews: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          commission_rate?: number | null
          company_description?: string | null
          company_name: string
          contact_person_first_name?: string
          contact_person_last_name?: string
          country?: string | null
          created_at?: string
          default_cancellation_policy?: string | null
          default_terms_conditions?: string | null
          email: string
          id: string
          is_verified?: boolean | null
          license_number?: string | null
          phone?: string | null
          rating?: number | null
          status?: string
          total_reviews?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          commission_rate?: number | null
          company_description?: string | null
          company_name?: string
          contact_person_first_name?: string
          contact_person_last_name?: string
          country?: string | null
          created_at?: string
          default_cancellation_policy?: string | null
          default_terms_conditions?: string | null
          email?: string
          id?: string
          is_verified?: boolean | null
          license_number?: string | null
          phone?: string | null
          rating?: number | null
          status?: string
          total_reviews?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      travelers: {
        Row: {
          avatar_url: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          id: string
          last_name: string
          nationality: string | null
          passport_number: string | null
          phone: string | null
          preferences: Json | null
          status: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          id: string
          last_name?: string
          nationality?: string | null
          passport_number?: string | null
          phone?: string | null
          preferences?: Json | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          id?: string
          last_name?: string
          nationality?: string | null
          passport_number?: string | null
          phone?: string | null
          preferences?: Json | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wishlist: {
        Row: {
          created_at: string
          id: string
          package_id: string
          traveler_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          package_id: string
          traveler_id: string
        }
        Update: {
          created_at?: string
          id?: string
          package_id?: string
          traveler_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlist_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlist_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "travelers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      agency_payments: {
        Row: {
          id: string | null
          booking_id: string | null
          amount: number | null
          currency: string | null
          status: string | null
          created_at: string | null
          package_title: string | null
          traveler_name: string | null
        }
        Relationships: []
      }
      active_deals: {
        Row: {
          agency_id: string | null
          discount_percentage: number | null
          end_date: string | null
          id: string | null
          original_price: number | null
          package_id: string | null
          sale_price: number | null
          start_date: string | null
          title: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "travel_agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      destination_stats: {
        Row: {
          average_price: number | null
          average_rating: number | null
          destination_id: string | null
          slug: string | null
          tour_count: number | null
        }
        Relationships: []
      }
      package_region_stats: {
        Row: {
          package_count: number | null
          region_key: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_description: string | null
          company_name: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      agency_public_stats: {
        Args: { agency_uuid: string }
        Returns: {
          tours_count: number
          travelers_count: number
          years_experience: number
        }[]
      }
      compute_platform_stats: {
        Args: { p_date?: string }
        Returns: {
          active_packages: number
          created_at: string
          id: string
          new_agencies: number
          new_travelers: number
          stat_date: string
          total_bookings: number
          total_revenue: number
        }
        SetofOptions: {
          from: "*"
          to: "platform_stats"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      review_authors: {
        Args: { review_ids: string[] }
        Returns: {
          avatar_url: string
          first_name: string
          last_name: string
          review_id: string
        }[]
      }
      save_package: {
        Args: {
          p_data: Json
          p_package_id: string
          p_submit_for_review?: boolean
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "agency" | "traveler"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "agency", "traveler"],
    },
  },
} as const
