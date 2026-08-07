-- Add missing DELETE policy and relax UPDATE policy for kajian_tasks
CREATE POLICY "kt_all_delete" ON public.kajian_tasks FOR DELETE USING (auth.uid() IS NOT NULL);

-- Drop the restrictive update policy if it exists and replace with open update
DROP POLICY IF EXISTS "kt_assigned_update" ON public.kajian_tasks;
CREATE POLICY "kt_all_update" ON public.kajian_tasks FOR UPDATE USING (auth.uid() IS NOT NULL);
